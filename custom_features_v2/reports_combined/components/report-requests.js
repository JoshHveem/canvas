export const requests = (() => {
  // Per-instance channels protect UI state without cancelling shared/cached HTTP work.
  const states = new WeakMap();
  const superseded = Symbol('superseded report request');

  function getState(vm) {
    if (!states.has(vm)) states.set(vm, { channels: new Map(), destroyed: false });
    return states.get(vm);
  }

  function updateLoading(vm, state, loadingKey) {
    if (!loadingKey) return;
    vm[loadingKey] = Array.from(state.channels.values())
      .some(request => request.active && request.loadingKey === loadingKey);
  }

  function cancel(vm, state, channel) {
    const previous = state.channels.get(channel);
    if (!previous) return;
    state.channels.delete(channel);
    previous.active = false;
    updateLoading(vm, state, previous.loadingKey);
  }

  return {
    beforeDestroy() {
      const state = getState(this);
      state.destroyed = true;
      for (const channel of state.channels.keys()) cancel(this, state, channel);
    },

    methods: {
      cancelReportRequest(channel) {
        cancel(this, getState(this), channel);
      },

      // Start before checking for empty selections so they also supersede old work.
      // Await request.wait(promise) at each stage; it gates all subsequent UI writes.
      // invalidate cancels dependent channels; loadingKey may be shared by channels.
      async runReportRequest(channel, options, work) {
        const state = getState(this);
        if (state.destroyed) return;
        for (const dependency of options.invalidate || []) cancel(this, state, dependency);
        cancel(this, state, channel);

        const token = { active: true, loadingKey: options.loadingKey ?? 'loading' };
        state.channels.set(channel, token);
        const isCurrent = () => !state.destroyed && state.channels.get(channel) === token;
        const request = {
          isCurrent,
          // Guard every asynchronous boundary before the caller can mutate UI state.
          async wait(promise) {
            const result = await promise;
            if (!isCurrent()) throw superseded;
            return result;
          }
        };

        updateLoading(this, state, token.loadingKey);
        if (options.clearError !== false) this.loadError = '';
        try {
          return await work(request);
        } catch (error) {
          if (isCurrent() && error !== superseded) {
            if (options.onError) options.onError(error);
            else {
              console.warn('Failed to load report', error);
              this.loadError = 'Unable to load report.';
            }
          }
        } finally {
          token.active = false;
          if (!state.destroyed) updateLoading(this, state, token.loadingKey);
          if (isCurrent() && options.onFinally) options.onFinally(request);
        }
      }
    }
  };
})();
