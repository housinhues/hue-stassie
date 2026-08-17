/* Hue Stasie local-first Supabase adapter. */
(function () {
  const state = {
    client: null,
    user: null,
    configured: false,
    pending: false
  };

  function config() {
    return window.HUESTASIE_SUPABASE || { url: '', anonKey: '' };
  }

  function setStatus(label, mode) {
    const el = document.getElementById('cloudStatus');
    if (!el) return;
    el.textContent = label;
    el.className = `cloud-status ${mode}`;
  }

  function setButtons() {
    const connect = document.getElementById('cloudConnectBtn');
    const sync = document.getElementById('cloudSyncBtn');
    if (connect) {
      connect.innerHTML = state.user
        ? '<i class="fas fa-right-from-bracket"></i> Sign out'
        : '<i class="fas fa-cloud"></i> Connect cloud';
    }
    if (sync) sync.disabled = !state.user || state.pending;
  }

  function configured() {
    const current = config();
    return Boolean(current.url && current.anonKey && window.supabase);
  }

  async function init() {
    state.configured = configured();
    if (!state.configured) {
      setStatus('LOCAL ONLY', 'offline');
      setButtons();
      return null;
    }

    try {
      state.client = window.supabase.createClient(config().url, config().anonKey);
      const { data, error } = await state.client.auth.getSession();
      if (error) throw error;
      state.user = data.session?.user || null;
      setStatus(state.user ? 'CLOUD READY' : 'SIGN IN TO SYNC', state.user ? 'online' : 'pending');
      setButtons();
      state.client.auth.onAuthStateChange((_event, session) => {
        state.user = session?.user || null;
        setStatus(state.user ? 'CLOUD READY' : 'SIGN IN TO SYNC', state.user ? 'online' : 'pending');
        setButtons();
      });
      return state.client;
    } catch (error) {
      console.warn('[Hue Stasie] Supabase initialization failed:', error);
      setStatus('CLOUD ERROR', 'offline');
      setButtons();
      return null;
    }
  }

  async function connect() {
    if (!state.configured) {
      alert('Cloud sync is not configured yet. Add the Supabase URL and anon key to supabase-config.js, then reload Hue Stasie.');
      return;
    }
    if (!state.client) await init();
    if (state.user) {
      await state.client.auth.signOut();
      return;
    }
    const email = prompt('Enter your Housing Hues email to receive a secure sign-in link:');
    if (!email) return;
    const { error } = await state.client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href }
    });
    if (error) {
      alert(`Could not send sign-in link: ${error.message}`);
      return;
    }
    setStatus('CHECK YOUR EMAIL', 'pending');
    alert('A secure sign-in link has been sent. Return here after opening it.');
  }

  function normalizeProject(project) {
    return {
      id: String(project.id),
      name: project.name || 'Untitled project',
      identity: project.identity || 'Housing Hues',
      status: project.status || 'pending',
      priority: project.priority || 'normal',
      nextAction: project.nextAction || '',
      notes: project.notes || '',
      workload: Number(project.workload) || 0,
      subtasks: Array.isArray(project.subtasks) ? project.subtasks.map((task) => ({
        id: String(task.id),
        text: task.text || '',
        done: Boolean(task.done)
      })) : []
    };
  }

  async function hydrate() {
    if (!state.client || !state.user) return null;
    const [projectsResult, subtasksResult, eventsResult, talentResult, settingsResult] = await Promise.all([
      state.client.from('projects').select('*'),
      state.client.from('subtasks').select('*'),
      state.client.from('events').select('*'),
      state.client.from('talent_members').select('*'),
      state.client.from('app_settings').select('*').eq('key', 'state').maybeSingle()
    ]);
    const firstError = [projectsResult, subtasksResult, eventsResult, talentResult, settingsResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const projects = (projectsResult.data || []).map((project) => normalizeProject({ ...project, nextAction: project.next_action }));
    const subtasksByProject = {};
    (subtasksResult.data || []).forEach((task) => {
      const projectId = String(task.project_id);
      if (!subtasksByProject[projectId]) subtasksByProject[projectId] = [];
      subtasksByProject[projectId].push({ id: String(task.id), text: task.text, done: task.done });
    });
    projects.forEach((project) => { project.subtasks = subtasksByProject[project.id] || []; });

    const settings = settingsResult.data?.value ? JSON.parse(settingsResult.data.value) : {};
    const members = talentResult.data || [];
    const categories = {};
    members.forEach((member) => {
      const category = member.category_key || 'models';
      if (!categories[category]) categories[category] = [];
      categories[category].push({ id: member.id, name: member.name, instagram: member.instagram || '', note: member.note || '' });
    });

    if (!projects.length && !eventsResult.data?.length && !members.length && !settings.activeIdentity) return null;
    return {
      ...settings,
      projects,
      events: (eventsResult.data || []).map((event) => ({
        id: String(event.id), title: event.title, date: event.date, time: event.time || '',
        with: event.with_person || '', memo: event.notes || ''
      })),
      talent: { activeCategory: settings.talent?.activeCategory || Object.keys(categories)[0] || 'models', categories: categories || {} }
    };
  }

  async function sync(localData) {
    if (!state.client || !state.user) throw new Error('Sign in before syncing.');
    state.pending = true;
    setStatus('SYNCING…', 'pending');
    setButtons();
    try {
      const projects = (localData.projects || []).map((project) => ({
        id: String(project.id), name: project.name, identity: project.identity,
        status: project.status, priority: project.priority,
        next_action: project.nextAction || '', notes: project.notes || '', workload: Number(project.workload) || 0,
        updated_at: new Date().toISOString()
      }));
      const subtasks = projects.flatMap((project, index) => (localData.projects[index]?.subtasks || []).map((task) => ({
        id: String(task.id), project_id: project.id, text: task.text || '', done: Boolean(task.done)
      })));
      const events = (localData.events || []).map((event) => ({
        id: String(event.id), title: event.title, date: event.date, time: event.time || '',
        with_person: event.with || '', notes: event.memo || ''
      }));
      const members = Object.entries(localData.talent?.categories || {}).flatMap(([category, entries]) =>
        (entries || []).map((member) => ({
          id: String(member.id), category_key: category, name: member.name,
          instagram: member.instagram || '', note: member.note || ''
        }))
      );
      const settings = {
        activeIdentity: localData.activeIdentity || '',
        instaMode: localData.instaMode || 'publer',
        customFacebook: localData.customFacebook || {},
        talent: { activeCategory: localData.talent?.activeCategory || 'models' }
      };

      const operations = [
        state.client.from('projects').upsert(projects),
        state.client.from('subtasks').upsert(subtasks),
        state.client.from('events').upsert(events),
        state.client.from('talent_members').upsert(members),
        state.client.from('app_settings').upsert({ key: 'state', value: JSON.stringify(settings), updated_at: new Date().toISOString() })
      ];
      const results = await Promise.all(operations);
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw failure;
      setStatus('CLOUD SYNCED', 'online');
    } finally {
      state.pending = false;
      setButtons();
    }
  }

  window.HueStasieCloud = { init, connect, hydrate, sync, isConfigured: () => state.configured, isSignedIn: () => Boolean(state.user) };
  window.connectCloud = () => connect().catch((error) => alert(`Cloud connection error: ${error.message}`));
  window.syncToCloud = () => {
    if (!state.user) return alert('Connect cloud first, then sync your local Hue Stasie data.');
    const current = window.HueStasieData?.();
    if (!current) return alert('Hue Stasie data is not ready yet.');
    sync(current).catch((error) => {
      console.error('[Hue Stasie] Sync failed:', error);
      setStatus('SYNC FAILED', 'offline');
      alert(`Sync failed: ${error.message}`);
    });
  };
  window.toggleCloudHelp = () => {
    const help = document.getElementById('cloudHelp');
    if (help) help.hidden = !help.hidden;
  };
})();
