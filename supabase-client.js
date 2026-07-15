// supabase-client.js

// Check if real Supabase configuration is provided in localStorage or window
const supabaseUrl = localStorage.getItem('SUPABASE_URL') || window.SUPABASE_URL;
const supabaseKey = localStorage.getItem('SUPABASE_KEY') || window.SUPABASE_KEY;

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
    { id: 't1', project_id: 'nike', phase: 1, title: 'Caption 200 reference images for Nike campaign dataset', assignee: 'Thomas', due_date: '2026-06-18', status: 'Done', training_status: null, fields: { imageCount: 200, captioningMethod: 'Manual' } },
    { id: 't2', project_id: 'nike', phase: 2, title: 'Prepare and export final training dataset — Nike x Future', assignee: 'Thomas', due_date: '2026-06-22', status: 'Done', training_status: null, fields: { targetResolution: '1024×1024', finalImageCount: 186, datasetPath: '/datasets/nike-x-future/v2_final.zip' } },
    { id: 't3', project_id: 'nike', phase: 3, title: 'Train Nike x Future LoRA on Flux base — 2000 steps', assignee: 'Erik', due_date: '2026-06-25', status: 'Done', training_status: 'Complete', fields: { baseModel: 'Flux.1-dev', trainingSteps: 2000, trainingHardware: 'RunPod A100', outputModelPath: '/models/nike-x-future/lora_v3_step2000.safetensors' } },
    { id: 't3b', project_id: 'nike', phase: 4, title: 'Draft creative brief & mood direction — Nike x Future', assignee: 'Thomas', due_date: '2026-06-26', status: 'Done', training_status: null, fields: { creativeBrief: 'Cinematic urban energy vs. editorial studio stillness — two directions to explore against the trained LoRA.', referenceBoards: '/refs/nike-x-future/moodboard_v2.pdf', approvedConcept: 'Pursue both directions into Exploration; cinematic urban is the lead.' } },
    { id: 't4', project_id: 'nike', phase: 5, title: 'Explore prompt directions for Nike x Future — cinematic, editorial, abstract', assignee: 'Thomas', due_date: '2026-06-27', status: 'In Progress', training_status: null, fields: { generationTool: 'ComfyUI', promptLog: 'cinematic urban, 35mm, dusk rim-light, wet asphalt reflections // editorial studio, hard flash, seamless white', approvedDirections: 'Direction 3 (cinematic urban) + Direction 5 (studio hard flash)' } },
    { id: 't5', project_id: 'nike', phase: 6, title: 'Generate final 80-image batch — direction 3 (cinematic urban)', assignee: 'Thomas', due_date: '2026-06-30', status: 'In Progress', training_status: null, fields: { generationTool: 'ComfyUI', outputFormat: '2048×2048 PNG', assetsGenerated: 80, assetsApproved: 54, outputFolderPath: '/deliverables/nike-x-future/batch_03/' } },
    { id: 't5b', project_id: 'nike', phase: 7, title: 'Refine direction 3 selects — added grain/detail pass', assignee: 'Thomas', due_date: '2026-07-01', status: 'In Progress', training_status: null, fields: { refinementNotes: 'Second pass on the 54 approved selects — tightening skin detail and grain matching to reference.', iterationCount: 3, refinedAssetCount: 54 } },
    { id: 't5c', project_id: 'nike', phase: 8, title: 'Upscale approved selects to delivery resolution', assignee: 'Erik', due_date: '2026-07-02', status: 'To Do', training_status: null, fields: { upscalingTool: 'Topaz Gigapixel', targetResolution: '3000×3000 px', assetsUpscaled: 0 } },
    { id: 't6', project_id: 'nike', phase: 9, title: 'Package and name final assets for post — Nike x Future', assignee: 'Thomas', due_date: '2026-07-03', status: 'To Do', training_status: null, fields: { notes: 'Awaiting producer sign-off on direction 3 selects before handoff.' } },
    { id: 't7', project_id: 'nike', phase: 10, title: 'Grade and retouch selected images', assignee: 'Erik', due_date: '2026-07-05', status: 'To Do', training_status: null, fields: { softwareUsed: 'Photoshop, DaVinci Resolve', outputFormatsRequired: '3000×3000 JPG, 1080p MP4', finalFileLocation: '/final/nike-x-future/' } },
    { id: 't8', project_id: 'nike', phase: 10, title: 'Export final files in all required formats', assignee: 'Erik', due_date: '2026-07-06', status: 'To Do', training_status: null, fields: { softwareUsed: 'After Effects', outputFormatsRequired: '9:16 Stories cut, 1:1 feed cut', finalFileLocation: '/final/nike-x-future/exports/' } }
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
            
            issues.forEach(issue => {
              const body = issue.body || '';
              const match = body.match(/<!-- studio-pm-meta (.*?) -->/);
              if (match) {
                try {
                  const meta = JSON.parse(match[1]);
                  issueNumberMap[meta.id] = issue.number;
                  tasks.push({
                    id: meta.id,
                    projectId: meta.projectId,
                    phase: meta.phase,
                    title: issue.title,
                    assignee: meta.assignee,
                    dueDate: meta.dueDate,
                    status: meta.status,
                    trainingStatus: meta.trainingStatus,
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
            
            const meta = {
              id: r.id,
              projectId: r.project_id,
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
    { id: 't1', project_id: 'nike', phase: 1, title: 'Caption 200 reference images for Nike campaign dataset', assignee: 'Thomas', due_date: '2026-06-18', status: 'Done', training_status: null, fields: { imageCount: 200, captioningMethod: 'Manual' } },
    { id: 't2', project_id: 'nike', phase: 2, title: 'Prepare and export final training dataset — Nike x Future', assignee: 'Thomas', due_date: '2026-06-22', status: 'Done', training_status: null, fields: { targetResolution: '1024×1024', finalImageCount: 186, datasetPath: '/datasets/nike-x-future/v2_final.zip' } },
    { id: 't3', project_id: 'nike', phase: 3, title: 'Train Nike x Future LoRA on Flux base — 2000 steps', assignee: 'Erik', due_date: '2026-06-25', status: 'Done', training_status: 'Complete', fields: { baseModel: 'Flux.1-dev', trainingSteps: 2000, trainingHardware: 'RunPod A100', outputModelPath: '/models/nike-x-future/lora_v3_step2000.safetensors' } },
    { id: 't3b', project_id: 'nike', phase: 4, title: 'Draft creative brief & mood direction — Nike x Future', assignee: 'Thomas', due_date: '2026-06-26', status: 'Done', training_status: null, fields: { creativeBrief: 'Cinematic urban energy vs. editorial studio stillness — two directions to explore against the trained LoRA.', referenceBoards: '/refs/nike-x-future/moodboard_v2.pdf', approvedConcept: 'Pursue both directions into Exploration; cinematic urban is the lead.' } },
    { id: 't4', project_id: 'nike', phase: 5, title: 'Explore prompt directions for Nike x Future — cinematic, editorial, abstract', assignee: 'Thomas', due_date: '2026-06-27', status: 'In Progress', training_status: null, fields: { generationTool: 'ComfyUI', promptLog: 'cinematic urban, 35mm, dusk rim-light, wet asphalt reflections // editorial studio, hard flash, seamless white', approvedDirections: 'Direction 3 (cinematic urban) + Direction 5 (studio hard flash)' } },
    { id: 't5', project_id: 'nike', phase: 6, title: 'Generate final 80-image batch — direction 3 (cinematic urban)', assignee: 'Thomas', due_date: '2026-06-30', status: 'In Progress', training_status: null, fields: { generationTool: 'ComfyUI', outputFormat: '2048×2048 PNG', assetsGenerated: 80, assetsApproved: 54, outputFolderPath: '/deliverables/nike-x-future/batch_03/' } },
    { id: 't5b', project_id: 'nike', phase: 7, title: 'Refine direction 3 selects — added grain/detail pass', assignee: 'Thomas', due_date: '2026-07-01', status: 'In Progress', training_status: null, fields: { refinementNotes: 'Second pass on the 54 approved selects — tightening skin detail and grain matching to reference.', iterationCount: 3, refinedAssetCount: 54 } },
    { id: 't5c', project_id: 'nike', phase: 8, title: 'Upscale approved selects to delivery resolution', assignee: 'Erik', due_date: '2026-07-02', status: 'To Do', training_status: null, fields: { upscalingTool: 'Topaz Gigapixel', targetResolution: '3000×3000 px', assetsUpscaled: 0 } },
    { id: 't6', project_id: 'nike', phase: 9, title: 'Package and name final assets for post — Nike x Future', assignee: 'Thomas', due_date: '2026-07-03', status: 'To Do', training_status: null, fields: { notes: 'Awaiting producer sign-off on direction 3 selects before handoff.' } },
    { id: 't7', project_id: 'nike', phase: 10, title: 'Grade and retouch selected images', assignee: 'Erik', due_date: '2026-07-05', status: 'To Do', training_status: null, fields: { softwareUsed: 'Photoshop, DaVinci Resolve', outputFormatsRequired: '3000×3000 JPG, 1080p MP4', finalFileLocation: '/final/nike-x-future/' } },
    { id: 't8', project_id: 'nike', phase: 10, title: 'Export final files in all required formats', assignee: 'Erik', due_date: '2026-07-06', status: 'To Do', training_status: null, fields: { softwareUsed: 'After Effects', outputFormatsRequired: '9:16 Stories cut, 1:1 feed cut', finalFileLocation: '/final/nike-x-future/exports/' } },
    { id: 'g1', project_id: 'gucci', phase: 1, title: 'Caption reference images — Gucci AW26 dataset', assignee: 'Thomas', due_date: '2026-06-20', status: 'Done', training_status: null, fields: { imageCount: 340, captioningMethod: 'Mixed' } },
    { id: 'g2', project_id: 'gucci', phase: 2, title: 'Prepare and export final training dataset for Gucci AW26 LoRA', assignee: 'Thomas', due_date: '2026-06-24', status: 'In Progress', training_status: null, fields: { targetResolution: '1024×1024', finalImageCount: 340, datasetPath: '/datasets/gucci-aw26/v1_final.zip' } },
    { id: 'g3', project_id: 'gucci', phase: 3, title: 'Train Gucci AW26 LoRA on SDXL base — 1500 steps', assignee: 'Erik', due_date: '2026-06-29', status: 'In Progress', training_status: 'Running', fields: { baseModel: 'SDXL 1.0', trainingSteps: 1500, trainingHardware: 'Local RTX 4090', outputModelPath: '—' } }
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
