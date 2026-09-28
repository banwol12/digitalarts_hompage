import { getSupabase } from './supabase';
import { INITIAL_WORKS, INITIAL_SITE } from './initialData';

const LS_WORKS = 'pf-works-v2';
const LS_SITE = 'pf-site-v2';
const LS_USER = 'pf-auth-user';

function getLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Master Admin credential check
function checkAdminCreds(username, password) {
  if (
    username &&
    password &&
    String(username).trim().toLowerCase() === 'admin' &&
    String(password) === 'admin1234'
  ) {
    return {
      id: 'admin',
      email: 'admin',
      role: 'admin',
      created_at: new Date().toISOString()
    };
  }
  return null;
}

const authListeners = new Set();

export const API = {
  auth: {
    getUser: async () => {
      try {
        const sess = sessionStorage.getItem(LS_USER);
        if (sess) return JSON.parse(sess);
        const loc = localStorage.getItem(LS_USER);
        if (loc) return JSON.parse(loc);
      } catch (e) {}

      const sb = getSupabase();
      if (sb) {
        try {
          const { data } = await sb.auth.getSession();
          if (data && data.session) return data.session.user;
        } catch (e) {}
      }
      return null;
    },

    signIn: async (usernameOrEmail, password) => {
      const masterAdmin = checkAdminCreds(usernameOrEmail, password);
      if (masterAdmin) {
        setLocal(LS_USER, masterAdmin);
        try {
          sessionStorage.setItem(LS_USER, JSON.stringify(masterAdmin));
        } catch (e) {}
        authListeners.forEach((fn) => fn(masterAdmin));
        return masterAdmin;
      }

      const sb = getSupabase();
      if (sb && String(usernameOrEmail).includes('@')) {
        const { data, error } = await sb.auth.signInWithPassword({
          email: usernameOrEmail,
          password: password
        });
        if (error) throw error;
        if (data && data.user) {
          authListeners.forEach((fn) => fn(data.user));
          return data.user;
        }
      }

      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다. (ID: admin, PW: admin1234)');
    },

    signOut: async () => {
      try {
        sessionStorage.removeItem(LS_USER);
        localStorage.removeItem(LS_USER);
      } catch (e) {}

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.auth.signOut();
        } catch (e) {}
      }
      authListeners.forEach((fn) => fn(null));
    },

    isAdmin: async () => {
      const user = await API.auth.getUser();
      if (!user) return false;
      if (user.role === 'admin' || user.id === 'admin' || user.email === 'admin') return true;

      const sb = getSupabase();
      if (sb) {
        try {
          const { data } = await sb.from('admins').select('email').limit(1);
          return !!(data && data.length);
        } catch (e) {
          return true;
        }
      }
      return true;
    },

    onChange: (callback) => {
      authListeners.add(callback);
      const sb = getSupabase();
      let sub = null;
      if (sb) {
        const { data } = sb.auth.onAuthStateChange((_, session) => {
          callback(session ? session.user : null);
        });
        sub = data.subscription;
      }
      return () => {
        authListeners.delete(callback);
        if (sub) sub.unsubscribe();
      };
    }
  },

  works: {
    list: async ({ all = false } = {}) => {
      let remoteWorks = [];
      const sb = getSupabase();
      if (sb) {
        try {
          let query = sb.from('works').select('*');
          if (!all) {
            query = query.eq('published', true).eq('status', 'approved');
          }
          const { data, error } = await query
            .order('sort', { ascending: true })
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            remoteWorks = data;
          }
        } catch (e) {
          console.warn('Supabase fetch failed, falling back to local storage:', e);
        }
      }

      // Merge with local changes
      let localWorks = getLocal(LS_WORKS, INITIAL_WORKS);
      if (!all) {
        localWorks = localWorks.filter((w) => w.published !== false && w.status !== 'rejected');
      }

      if (remoteWorks.length > 0) {
        const known = new Set(remoteWorks.map((w) => w.slug));
        const extraLocal = localWorks.filter((w) => !known.has(w.slug));
        return [...remoteWorks, ...extraLocal].sort((a, b) => (a.sort || 0) - (b.sort || 0));
      }

      return localWorks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    },

    getBySlug: async (slug) => {
      const all = await API.works.list({ all: true });
      return all.find((w) => w.slug === slug) || null;
    },

    submit: async (workData) => {
      const isApproved = workData.published !== false && workData.status !== 'pending';
      const newWork = {
        id: workData.id || `work-${Date.now()}`,
        sort: workData.sort || 0,
        status: workData.status || (isApproved ? 'approved' : 'pending'),
        published: workData.published !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...workData
      };

      // Always save locally
      const localList = getLocal(LS_WORKS, INITIAL_WORKS);
      localList.unshift(newWork);
      setLocal(LS_WORKS, localList);

      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('works').insert(newWork).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Supabase insert failed, safely saved locally:', e);
        }
      }
      return newWork;
    },

    save: async (work) => {
      const updated = {
        ...work,
        updated_at: new Date().toISOString()
      };

      // Update local storage
      const localList = getLocal(LS_WORKS, INITIAL_WORKS);
      const idx = localList.findIndex((w) => w.id === updated.id || w.slug === updated.slug);
      if (idx >= 0) {
        localList[idx] = updated;
      } else {
        localList.push(updated);
      }
      setLocal(LS_WORKS, localList);

      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('works').upsert(updated).select().single();
          if (!error && data) return data;
        } catch (e) {
          console.warn('Supabase upsert failed, stored locally:', e);
        }
      }
      return updated;
    },

    delete: async (id) => {
      const localList = getLocal(LS_WORKS, INITIAL_WORKS);
      const filtered = localList.filter((w) => w.id !== id && w.slug !== id);
      setLocal(LS_WORKS, filtered);

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('works').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete failed:', e);
        }
      }
    },

    reorder: async (works) => {
      const updatedList = works.map((w, index) => ({
        ...w,
        sort: index + 1
      }));
      setLocal(LS_WORKS, updatedList);

      const sb = getSupabase();
      if (sb) {
        try {
          const updates = updatedList.map((w) => ({
            id: w.id,
            slug: w.slug,
            sort: w.sort
          }));
          await sb.from('works').upsert(updates);
        } catch (e) {
          console.warn('Supabase reorder failed:', e);
        }
      }
      return updatedList;
    }
  },

  site: {
    get: async () => {
      const local = getLocal(LS_SITE, INITIAL_SITE);
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('site').select('key,value');
          if (!error && data && data.length > 0) {
            const map = {};
            data.forEach((r) => {
              map[r.key] = r.value;
            });
            return { ...local, ...map };
          }
        } catch (e) {}
      }
      return local;
    },

    save: async (siteMap) => {
      const current = getLocal(LS_SITE, INITIAL_SITE);
      const merged = { ...current, ...siteMap };
      setLocal(LS_SITE, merged);

      const sb = getSupabase();
      if (sb) {
        try {
          const rows = Object.keys(siteMap).map((k) => ({
            key: k,
            value: siteMap[k],
            updated_at: new Date().toISOString()
          }));
          await sb.from('site').upsert(rows);
        } catch (e) {
          console.warn('Supabase site update failed:', e);
        }
      }
      return merged;
    }
  },

  storage: {
    upload: async (file, path) => {
      const sb = getSupabase();
      if (sb) {
        try {
          const { error } = await sb.storage
            .from('portfolio')
            .upload(path, file, { upsert: true, contentType: file.type });
          if (!error) {
            const { data } = sb.storage.from('portfolio').getPublicUrl(path);
            if (data && data.publicUrl) return data.publicUrl;
          }
        } catch (e) {
          console.warn('Supabase storage upload failed, falling back to DataURL:', e);
        }
      }

      // Base64 DataURL fallback
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  newsletter: {
    subscribe: async (email, source = 'homepage') => {
      const sb = getSupabase();
      if (sb) {
        try {
          const { error } = await sb.from('subscribers').insert({ email, source });
          if (error) {
            if (error.code === '23505') {
              return { success: true, message: '이미 구독 중인 이메일입니다.' };
            }
            throw error;
          }
          return { success: true, message: '뉴스레터 구독이 완료되었습니다!' };
        } catch (e) {
          console.warn('Supabase subscribe error:', e);
        }
      }
      return { success: true, message: '뉴스레터 구독이 완료되었습니다! (Local)' };
    }
  }
};
