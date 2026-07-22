// supabase-client.js

// Default Live Supabase Credentials (Naughty Society Studio PM)
const LIVE_SUPABASE_URL = 'https://jffohmxwmvexbhtdthzn.supabase.co';
const LIVE_SUPABASE_KEY = '[REDACTED]';

const supabaseUrl = localStorage.getItem('SUPABASE_URL') || LIVE_SUPABASE_URL;
const supabaseKey = localStorage.getItem('SUPABASE_KEY') || LIVE_SUPABASE_KEY;

// Check if GitHub Configuration is provided in localStorage
const githubPat = localStorage.getItem('github_pat');
const githubRepo = localStorage.getItem('github_repo') || 'NuaghtySociety/NS_studio-pm';

let client;

if (githubPat && githubPat.trim() !== '') {
  console.log('[Supabase Client] GitHub PAT found! Initializing GitHub Issues Database Engine...');
  
  const headers = {
    'Authorization': 'Bearer ' + githubPat.trim(),
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  
  const issueNumberMap = {};
  const listeners = [];

      const DEFAULT_TASKS = [
    { id: 'm1', project_id: 'adidas', phase: 1, title: '01 · Sketch & Look & Feel (Stage 1)', assignee: 'Thomas', due_date: '2026-08-07', status: 'To Do', training_status: null, description: `Establish creative direction, lighting, consistency, pose. Milestones:
- Jul 31: First sketch presentation (18 sketches total)
- Aug 3: Feedback deadline
- Aug 6: Reworked sketch presentation
- Aug 7: Feedback deadline`, fields: { start_date: '2026-07-31' } },
    { id: 'm2', project_id: 'adidas', phase: 2, title: '02 · First Production Round (Stage 2)', assignee: 'Erik', due_date: '2026-08-18', status: 'To Do', training_status: null, description: `Low-res prioritised images. Milestones:
- Aug 14: First production presentation (4-6 images)
- Aug 14: Summer pause begins
- Aug 18: Feedback deadline`, fields: { start_date: '2026-08-14' } },
    { id: 'm3', project_id: 'adidas', phase: 3, title: '03 · Summer Pause & Restart (Stage 2/3)', assignee: 'Erik', due_date: '2026-09-02', status: 'To Do', training_status: null, description: `Production pause. Sep 2: Production restarts. Order set by priorities and feedback.`, fields: { start_date: '2026-08-14' } },
    { id: 'm4', project_id: 'adidas', phase: 6, title: '04 · Production Rework (Stage 3)', assignee: 'Thomas', due_date: '2026-09-22', status: 'To Do', training_status: null, description: `Lock composition and grade. Milestones:
- Sep 8: Reworked image presentation
- Sep 14: Second production presentation (6 images)
- Sep 15: Feedback deadline (preferred)
- Sep 16: Feedback deadline (latest)
- Sep 22: Final production presentation`, fields: { start_date: '2026-09-02' } },
    { id: 'm5', project_id: 'adidas', phase: 7, title: '05 · Product Review & Sign-Off (Stage 4)', assignee: 'Erik', due_date: '2026-09-28', status: 'To Do', training_status: null, description: `adidas Product Manager final review (Wed Sep 24-25). Sep 28: Final image approval deadline. Scope: product shape, materials, logos & branding placement.`, fields: { start_date: '2026-09-23' } },
    { id: 'm6', project_id: 'adidas', phase: 8, title: '06 · Final Dev & 16K Upscaling (Stage 5)', assignee: 'Thomas', due_date: '2026-10-21', status: 'To Do', training_status: null, description: `Final detailing, texture and upscaling. Milestones:
- Oct 5-13: Final detailing & refining
- Oct 14: Review presentation
- Oct 15-21: Upscale to max 16K
- Oct 21: Main image handover (uncropped PNGs)`, fields: { start_date: '2026-10-05' } },
    { id: 'm7', project_id: 'adidas', phase: 10, title: '07 · Video Presentation & Remaining Images (Stage 6)', assignee: 'Thomas', due_date: '2026-10-23', status: 'To Do', training_status: null, description: `Milestones:
- Oct 22: First video presentation (4K hero ratio)
- Oct 23: Feedback deadline (selection, timing, accuracy)
- Parallel: remaining/added-later images continue.`, fields: { start_date: '2026-10-22' } },
    { id: 'm8', project_id: 'adidas', phase: 10, title: '08 · Final Asset Handover (Stage 7)', assignee: 'Erik', due_date: '2026-10-28', status: 'To Do', training_status: null, description: `Final Handover Target: October 28. Deliverables:
- Video assets for More Digital post & sound
- Remaining images & deprioritised assets.`, fields: { start_date: '2026-10-28' } }
  ];

  client = {
    auth: {
      getSession: async () => {
        const localSess = localStorage.getItem('mock_session');
        const email = localSess ? JSON.parse(localSess).user.email : 'Thomas@naughtysociety.ai';
        return { data: { session: { user: { email } } }, error: null };
      },
      onAuthStateChange: (cb) => {
        const localSess = localStorage.getItem('mock_session');
        const email = localSess ? JSON.parse(localSess).user.email : 'Thomas@naughtysociety.ai';
        setTimeout(() => cb('SIGNED_IN', { user: { email } }), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { session: { user: { email: 'github-team@naughtysociety.ai' } } }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (table) => {
      if (table !== 'tasks') {
        // Return dummy/localStorage selects for projects and team_members so they are fully customizable
        return {
          select: async () => {
            const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
            const data = localStorage.getItem(storeKey);
            let parsed = [];
            if (data) {
              parsed = JSON.parse(data);
              if (table === 'team_members') {
                parsed = parsed.map(name => ({ id: name, name: name }));
              }
            } else {
              // Defaults if empty
              if (table === 'projects') {
                parsed = [
                  { id: 'nike', index: '01', name: 'Nike x Future', color: '#C4653B', baseModel: 'Flux.1-dev', loraPath: '/models/nike-x-future/lora_v3_step2000.safetensors', generationTool: 'ComfyUI', targetFormat: '120 × 3000px JPG images' },
                  { id: 'gucci', index: '02', name: 'Gucci AW26', color: '#3B6B57', baseModel: 'SDXL 1.0', loraPath: '— pending training', generationTool: 'Automatic1111', targetFormat: '10 × 15s vertical videos' }
                ];
              } else {
                parsed = ['Thomas', 'Erik', 'Thomas', 'Erik', 'Thomas'].map(name => ({ id: name, name: name }));
              }
            }
            return { data: parsed, error: null };
          },
          upsert: async (row) => {
            const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
            const rows = Array.isArray(row) ? row : [row];
            let list = localStorage.getItem(storeKey) ? JSON.parse(localStorage.getItem(storeKey)) : [];
            rows.forEach(r => {
              const val = table === 'projects' ? r : r.name;
              const idx = list.findIndex(item => (table === 'projects' ? item.id === r.id : item === r.name));
              if (idx >= 0) list[idx] = val; else list.push(val);
            });
            localStorage.setItem(storeKey, JSON.stringify(list));
            return { error: null };
          },
          delete: () => {
            return {
              eq: async (col, val) => {
                const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
                let list = localStorage.getItem(storeKey) ? JSON.parse(localStorage.getItem(storeKey)) : [];
                list = list.filter(item => (table === 'projects' ? item.id !== val : item !== val));
                localStorage.setItem(storeKey, JSON.stringify(list));
                return { error: null };
              }
            };
          }
        };
      }
      
      return {
        select: async () => {
          try {
            console.log('[GitHub DB] Fetching tasks from GitHub Issues...');
            const res = await fetch(`https://api.github.com/repos/${githubRepo}/issues?state=open&per_page=100`, { headers });
            if (!res.ok) {
              const errText = await res.text();
              console.error('Failed to fetch GitHub issues:', errText);
              if (res.status === 401 || res.status === 403 || res.status === 404) {
                alert(`GitHub Connection Error (${res.status})! Your Personal Access Token might be invalid, expired, or doesn't have access to this repo. Reconnecting in offline mode so you do not lose access!`);
                localStorage.removeItem('github_pat');
                window.location.reload();
              }
              return { data: [], error: { message: 'GitHub API error: ' + res.status } };
            }
            const issues = await res.json();
            const tasks = [];
            
            // Locate local Adidas project spelling to normalize IDs dynamically!
            const localProjsStr = localStorage.getItem('studio_projects');
            const localProjs = localProjsStr ? JSON.parse(localProjsStr) : [];
            const activeAdidasProj = localProjs.find(p => p.id === 'adidas' || p.id === 'addidas' || p.name.toLowerCase().includes('adidas') || p.name.toLowerCase().includes('addidas'));
            const localAdidasId = activeAdidasProj ? activeAdidasProj.id : 'adidas';

            issues.forEach(issue => {
              const body = issue.body || '';
              const match = body.match(/<!-- studio-pm-meta (.*?) -->/);
              if (match) {
                try {
                  const meta = JSON.parse(match[1]);
                  issueNumberMap[meta.id] = issue.number;
                  
                  let taskProjId = meta.projectId;
                  if (taskProjId === 'adidas' || taskProjId === 'addidas') {
                    taskProjId = localAdidasId;
                  }

                  tasks.push({
                    id: meta.id,
                    project_id: taskProjId,
                    phase: meta.phase,
                    title: issue.title,
                    assignee: meta.assignee,
                    due_date: meta.dueDate,
                    status: meta.status,
                    training_status: meta.trainingStatus,
                    description: body.replace(/<!-- studio-pm-meta .*? -->/s, '').trim(),
                    fields: Object.assign({}, meta.fields, { github_issue_number: issue.number })
                  });
                } catch (e) {
                  console.warn('Failed to parse issue metadata:', issue.number, e);
                }
              }
            });
            
            console.log('[GitHub DB] Loaded ' + tasks.length + ' tasks successfully!');
            return { data: tasks, error: null };
          } catch (err) {
            console.error('GitHub fetch tasks error:', err);
            return { data: [], error: err };
          }
        },
        upsert: async (row) => {
          const rows = Array.isArray(row) ? row : [row];
          for (const r of rows) {
            const issueNumber = r.fields?.github_issue_number || issueNumberMap[r.id];
            
            let taskProjId = r.project_id;
            if (taskProjId === 'adidas' || taskProjId === 'addidas') {
              taskProjId = 'adidas'; // Always save as 'adidas' on GitHub for universal syncing!
            }

            const meta = {
              id: r.id,
              projectId: taskProjId,
              phase: r.phase,
              assignee: r.assignee,
              dueDate: r.due_date,
              status: r.status,
              trainingStatus: r.training_status,
              fields: r.fields
            };
            
            const body = `${r.description || ''}\n\n<!-- studio-pm-meta ${JSON.stringify(meta)} -->`;
            const payload = { title: r.title, body };
            
            try {
              let res;
              if (issueNumber) {
                console.log('[GitHub DB] Updating existing issue:', issueNumber);
                res = await fetch(`https://api.github.com/repos/${githubRepo}/issues/${issueNumber}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify(payload)
                });
              } else {
                console.log('[GitHub DB] Creating new issue...');
                res = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const data = await res.json();
                  issueNumberMap[r.id] = data.number;
                  r.fields = Object.assign({}, r.fields, { github_issue_number: data.number });
                }
              }
              
              if (!res.ok) {
                const errText = await res.text();
                console.error('GitHub upsert issue failed:', errText);
                if (res.status === 401 || res.status === 403 || res.status === 404) {
                  alert(`GitHub Write Error (${res.status})! Your token does not have write permissions for this repository. Switching to offline mode...`);
                  localStorage.removeItem('github_pat');
                  window.location.reload();
                  return { error: { message: 'Write permission error: ' + res.status } };
                }
              } else {
                console.log('[GitHub DB] Successfully upserted issue!');
              }
            } catch (err) {
              console.error('GitHub upsert error:', err);
            }
          }
          return { error: null };
        },
        delete: () => {
          return {
            eq: async (col, val) => {
              if (col !== 'id') return { error: null };
              const issueNumber = issueNumberMap[val];
              if (!issueNumber) return { error: null };
              
              console.log('[GitHub DB] Closing issue on GitHub:', issueNumber);
              try {
                const res = await fetch(`https://api.github.com/repos/${githubRepo}/issues/${issueNumber}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({ state: 'closed' })
                });
                if (!res.ok) {
                  console.error('GitHub close issue failed:', await res.text());
                } else {
                  console.log('[GitHub DB] Successfully closed issue!');
                }
              } catch (err) {
                console.error('GitHub delete task error:', err);
              }
              return { error: null };
            }
          };
        }
      };
    },
    channel: (name) => {
      const chan = {
        on: (event, filter, callback) => chan,
        subscribe: () => chan,
        unsubscribe: () => {}
      };
      return chan;
    }
  };
} else if (supabaseUrl && supabaseKey) {
  console.log('[Supabase Client] Initializing real Supabase client...');
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('[Supabase Client] No credentials found. Initializing Local Mock Client (Offline Mode)...');
  
  const listeners = [];
  const authListeners = [];

      const DEFAULT_TASKS = [
    { id: 'm1', project_id: 'adidas', phase: 1, title: '01 · Sketch & Look & Feel (Stage 1)', assignee: 'Thomas', due_date: '2026-08-07', status: 'To Do', training_status: null, description: `Establish creative direction, lighting, consistency, pose. Milestones:
- Jul 31: First sketch presentation (18 sketches total)
- Aug 3: Feedback deadline
- Aug 6: Reworked sketch presentation
- Aug 7: Feedback deadline`, fields: { start_date: '2026-07-31' } },
    { id: 'm2', project_id: 'adidas', phase: 2, title: '02 · First Production Round (Stage 2)', assignee: 'Erik', due_date: '2026-08-18', status: 'To Do', training_status: null, description: `Low-res prioritised images. Milestones:
- Aug 14: First production presentation (4-6 images)
- Aug 14: Summer pause begins
- Aug 18: Feedback deadline`, fields: { start_date: '2026-08-14' } },
    { id: 'm3', project_id: 'adidas', phase: 3, title: '03 · Summer Pause & Restart (Stage 2/3)', assignee: 'Erik', due_date: '2026-09-02', status: 'To Do', training_status: null, description: `Production pause. Sep 2: Production restarts. Order set by priorities and feedback.`, fields: { start_date: '2026-08-14' } },
    { id: 'm4', project_id: 'adidas', phase: 6, title: '04 · Production Rework (Stage 3)', assignee: 'Thomas', due_date: '2026-09-22', status: 'To Do', training_status: null, description: `Lock composition and grade. Milestones:
- Sep 8: Reworked image presentation
- Sep 14: Second production presentation (6 images)
- Sep 15: Feedback deadline (preferred)
- Sep 16: Feedback deadline (latest)
- Sep 22: Final production presentation`, fields: { start_date: '2026-09-02' } },
    { id: 'm5', project_id: 'adidas', phase: 7, title: '05 · Product Review & Sign-Off (Stage 4)', assignee: 'Erik', due_date: '2026-09-28', status: 'To Do', training_status: null, description: `adidas Product Manager final review (Wed Sep 24-25). Sep 28: Final image approval deadline. Scope: product shape, materials, logos & branding placement.`, fields: { start_date: '2026-09-23' } },
    { id: 'm6', project_id: 'adidas', phase: 8, title: '06 · Final Dev & 16K Upscaling (Stage 5)', assignee: 'Thomas', due_date: '2026-10-21', status: 'To Do', training_status: null, description: `Final detailing, texture and upscaling. Milestones:
- Oct 5-13: Final detailing & refining
- Oct 14: Review presentation
- Oct 15-21: Upscale to max 16K
- Oct 21: Main image handover (uncropped PNGs)`, fields: { start_date: '2026-10-05' } },
    { id: 'm7', project_id: 'adidas', phase: 10, title: '07 · Video Presentation & Remaining Images (Stage 6)', assignee: 'Thomas', due_date: '2026-10-23', status: 'To Do', training_status: null, description: `Milestones:
- Oct 22: First video presentation (4K hero ratio)
- Oct 23: Feedback deadline (selection, timing, accuracy)
- Parallel: remaining/added-later images continue.`, fields: { start_date: '2026-10-22' } },
    { id: 'm8', project_id: 'adidas', phase: 10, title: '08 · Final Asset Handover (Stage 7)', assignee: 'Erik', due_date: '2026-10-28', status: 'To Do', training_status: null, description: `Final Handover Target: October 28. Deliverables:
- Video assets for More Digital post & sound
- Remaining images & deprioritised assets.`, fields: { start_date: '2026-10-28' } }
  ];

  // Helper to load/save mock tasks
  const getTasks = () => {
    const data = localStorage.getItem('mock_tasks');
    if (!data) {
      localStorage.setItem('mock_tasks', JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(data);
  };

  const saveTasks = (tasks) => {
    localStorage.setItem('mock_tasks', JSON.stringify(tasks));
  };

  // Helper to load/save users and session
  const getUsers = () => {
    const data = localStorage.getItem('mock_users');
    return data ? JSON.parse(data) : [];
  };

  const saveUsers = (users) => {
    localStorage.setItem('mock_users', JSON.stringify(users));
  };

  const getSession = () => {
    const data = localStorage.getItem('mock_session');
    return data ? JSON.parse(data) : null;
  };

  const saveSession = (session) => {
    if (session) {
      localStorage.setItem('mock_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mock_session');
    }
    authListeners.forEach(cb => cb('SIGNED_IN', session));
  };

  client = {
    auth: {
      getSession: async () => {
        const session = getSession();
        return { data: { session }, error: null };
      },
      onAuthStateChange: (cb) => {
        authListeners.push(cb);
        const session = getSession();
        setTimeout(() => cb(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session), 0);
        return { data: { subscription: { unsubscribe: () => {
          const idx = authListeners.indexOf(cb);
          if (idx !== -1) authListeners.splice(idx, 1);
        } } } };
      },
      signUp: async ({ email, password }) => {
        const users = getUsers();
        if (users.some(u => u.email === email)) {
          return { data: { session: null }, error: { message: 'User already exists.' } };
        }
        users.push({ email, password });
        saveUsers(users);
        return { data: { session: null }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const users = getUsers();
        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          // Auto-register any new email instantly for maximum convenience!
          user = { email, password };
          users.push(user);
          saveUsers(users);
        } else if (user.password !== password) {
          return { data: { session: null }, error: { message: 'Invalid password.' } };
        }
        const session = { user: { email } };
        saveSession(session);
        return { data: { session }, error: null };
      },
      signOut: async () => {
        saveSession(null);
        return { error: null };
      }
    },
    from: (table) => {
      if (table !== 'tasks') {
        return {
          select: async () => {
            const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
            const data = localStorage.getItem(storeKey);
            let parsed = [];
            if (data) {
              parsed = JSON.parse(data);
              if (table === 'team_members') {
                parsed = parsed.map(name => ({ id: name, name: name }));
              }
            } else {
              if (table === 'projects') {
                parsed = [
                  { id: 'nike', index: '01', name: 'Nike x Future', color: '#C4653B', baseModel: 'Flux.1-dev', loraPath: '/models/nike-x-future/lora_v3_step2000.safetensors', generationTool: 'ComfyUI', targetFormat: '120 × 3000px JPG images' },
                  { id: 'gucci', index: '02', name: 'Gucci AW26', color: '#3B6B57', baseModel: 'SDXL 1.0', loraPath: '— pending training', generationTool: 'Automatic1111', targetFormat: '10 × 15s vertical videos' }
                ];
              } else {
                parsed = ['Thomas', 'Erik', 'Thomas', 'Erik', 'Thomas'].map(name => ({ id: name, name: name }));
              }
            }
            return { data: parsed, error: null };
          },
          upsert: async (row) => {
            const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
            const rows = Array.isArray(row) ? row : [row];
            let list = localStorage.getItem(storeKey) ? JSON.parse(localStorage.getItem(storeKey)) : [];
            rows.forEach(r => {
              const val = table === 'projects' ? r : r.name;
              const idx = list.findIndex(item => (table === 'projects' ? item.id === r.id : item === r.name));
              if (idx >= 0) list[idx] = val; else list.push(val);
            });
            localStorage.setItem(storeKey, JSON.stringify(list));
            return { error: null };
          },
          delete: () => {
            return {
              eq: async (col, val) => {
                const storeKey = table === 'projects' ? 'studio_projects' : 'studio_team';
                let list = localStorage.getItem(storeKey) ? JSON.parse(localStorage.getItem(storeKey)) : [];
                list = list.filter(item => (table === 'projects' ? item.id !== val : item !== val));
                localStorage.setItem(storeKey, JSON.stringify(list));
                return { error: null };
              }
            };
          }
        };
      }
      
      return {
        select: async () => {
          return { data: getTasks(), error: null };
        },
        upsert: async (row) => {
          const tasks = getTasks();
          const rows = Array.isArray(row) ? row : [row];
          let updatedRows = [];
          
          rows.forEach(r => {
            const idx = tasks.findIndex(t => t.id === r.id);
            if (idx >= 0) {
              tasks[idx] = Object.assign({}, tasks[idx], r);
              updatedRows.push({ type: 'UPDATE', row: tasks[idx] });
            } else {
              tasks.push(r);
              updatedRows.push({ type: 'INSERT', row: r });
            }
          });
          
          saveTasks(tasks);
          
          updatedRows.forEach(({ type, row }) => {
            listeners.forEach(listener => {
              if (listener.table === 'tasks') {
                listener.callback({
                  eventType: type,
                  new: row,
                  old: type === 'UPDATE' ? { id: row.id } : null
                });
              }
            });
          });
          
          return { error: null };
        },
        delete: () => {
          return {
            eq: async (col, val) => {
              if (col !== 'id') throw new Error(`Unsupported mock delete filter: ${col}`);
              const tasks = getTasks();
              const filtered = tasks.filter(t => t.id !== val);
              saveTasks(filtered);
              
              listeners.forEach(listener => {
                if (listener.table === 'tasks') {
                  listener.callback({
                    eventType: 'DELETE',
                    old: { id: val }
                  });
                }
              });
              
              return { error: null };
            }
          };
        }
      };
    },
    channel: (name) => {
      const channelListeners = [];
      const chan = {
        on: (event, filter, callback) => {
          if (filter.table === 'tasks') {
            channelListeners.push({ table: 'tasks', callback });
          }
          return chan;
        },
        subscribe: () => {
          channelListeners.forEach(l => listeners.push(l));
          return chan;
        },
        unsubscribe: () => {
          channelListeners.forEach(l => {
            const idx = listeners.indexOf(l);
            if (idx !== -1) listeners.splice(idx, 1);
          });
        }
      };
      return chan;
    }
  };
}

// Expose a helper to easily switch to a real Supabase configuration via DevTools console
window.setSupabaseConfig = (url, key) => {
  if (!url || !key) {
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_KEY');
    console.log('Cleared Supabase credentials. Reloading page for local mock mode...');
  } else {
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_KEY', key);
    console.log('Saved Supabase credentials. Reloading page to connect...');
  }
  window.location.reload();
};

export async function getClient() {
  return client;
}
