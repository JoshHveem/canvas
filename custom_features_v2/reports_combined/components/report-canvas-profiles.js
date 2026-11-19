export const canvasProfiles = {
  methods: {
    getCanvasUserNameCache() {
      if (!this.__canvasUserNameCache || typeof this.__canvasUserNameCache !== 'object') {
        this.__canvasUserNameCache = {};
      }
      return this.__canvasUserNameCache;
    },

    extractCanvasUserNames(profile) {
      const explicitFirstName = String(profile?.first_name ?? '').trim();
      const explicitLastName = String(profile?.last_name ?? '').trim();
      if (explicitFirstName || explicitLastName) {
        return { first_name: explicitFirstName, last_name: explicitLastName };
      }
    
      const sortableName = String(profile?.sortable_name ?? '').trim();
      if (sortableName.includes(',')) {
        const [lastName, ...firstNameParts] = sortableName.split(',');
        return {
          first_name: firstNameParts.join(',').trim(),
          last_name: String(lastName ?? '').trim()
        };
      }
    
      const fullName = String(profile?.name ?? profile?.short_name ?? '').trim();
      const [firstName = '', ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
      return { first_name: firstName, last_name: lastNameParts.join(' ') };
    },

    async fetchCanvasUserProfile(canvasUserId) {
      const id = String(canvasUserId ?? '').trim();
      if (!id) return { first_name: '', last_name: '' };
    
      const cache = this.getCanvasUserNameCache();
      if (Object.prototype.hasOwnProperty.call(cache, id)) {
        const cachedNames = cache[id];
        if (String(cachedNames?.first_name ?? '').trim() || String(cachedNames?.last_name ?? '').trim()) {
          return cachedNames;
        }
        delete cache[id];
      }
    
      try {
        const response = await fetch(`/api/v1/users/${encodeURIComponent(id)}/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' }
        });
    
        if (!response.ok) {
          throw new Error(`Canvas user lookup failed with ${response.status}`);
        }
    
        const profile = await response.json();
        const names = this.extractCanvasUserNames(profile);
        if (names.first_name || names.last_name) {
          cache[id] = names;
        } else {
          console.warn(`Canvas user profile for ${id} did not include a usable name`);
        }
        return names;
      } catch (e) {
        console.warn(`Failed to load Canvas user profile for ${id}`, e);
        delete cache[id];
        return { first_name: '', last_name: '' };
      }
    },

    async hydrateSisUserIds(rows, options = {}) {
      const normalizedRows = Array.isArray(rows) ? rows : [];
      if (!options?.hydrate_sis_user_id) return normalizedRows;
    
      const uniqueIds = Array.from(new Set(
        normalizedRows
          .map(row => String(row?.canvas_user_id ?? '').trim())
          .filter(Boolean)
      ));
    
      const cache = this.getCanvasUserNameCache();
      const pendingIds = uniqueIds.filter(id => !Object.prototype.hasOwnProperty.call(cache, id));
      const chunkSize = 10;
    
      for (let i = 0; i < pendingIds.length; i += chunkSize) {
        const chunk = pendingIds.slice(i, i + chunkSize);
        await Promise.all(chunk.map(id => this.fetchCanvasUserProfile(id)));
      }
    
      return normalizedRows.map(row => {
        const canvasUserId = String(row?.canvas_user_id ?? '').trim();
        const hydratedNames = canvasUserId && cache[canvasUserId]
          ? cache[canvasUserId]
          : {};
        return {
          ...row,
          original_sis_user_id: String(row?.original_sis_user_id ?? row?.sis_user_id ?? '').trim(),
          first_name: String(hydratedNames?.first_name ?? row?.first_name ?? '').trim(),
          last_name: String(hydratedNames?.last_name ?? row?.last_name ?? '').trim()
        };
      });
    }
  }
};
