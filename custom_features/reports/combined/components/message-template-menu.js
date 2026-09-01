(function () {
  Vue.component('message-template-menu', {
    props: {
      templates: { type: Array, default: () => [] },
      ariaLabel: { type: String, default: 'Open message templates' }
    },

    data() {
      return { isOpen: false };
    },

    methods: {
      close() {
        this.isOpen = false;
      }
    },

    template: `
      <span style="display:inline-block;">
        <button type="button" class="Button Button--icon-action" :title="ariaLabel" :aria-label="ariaLabel" @click.stop="isOpen = true">
          <i class="icon-compose" aria-hidden="true"></i>
        </button>
        <div v-if="isOpen" role="presentation" @click.self="close" style="position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; background:rgba(17,24,39,.45);">
          <section role="dialog" aria-modal="true" aria-label="Message templates" style="width:min(28rem, 100%); background:#fff; border-radius:6px; box-shadow:0 12px 30px rgba(0,0,0,.25); padding:1.25rem;">
            <h3 style="margin:0 0 1rem; font-size:1.1rem;">Message student</h3>
            <div style="display:flex; flex-direction:column; gap:.5rem;">
              <a v-for="template in templates" :key="template.label" :href="template.href" target="_blank" rel="noopener noreferrer" class="Button" style="text-align:left;" @click="close">{{ template.label }}</a>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
              <button type="button" class="Button" @click="close">Cancel</button>
            </div>
          </section>
        </div>
      </span>
    `
  });

  window.ReportColumnTypes = window.ReportColumnTypes || {};
  window.ReportColumnTypes.messageTemplateMenu = function (options = {}) {
    const templates = typeof options.templates === 'function' ? options.templates : () => [];
    const column = new window.ReportColumn(
      '',
      options.description || 'Open Canvas Inbox message templates for this student.',
      options.width || '2rem',
      false,
      'string',
      () => '',
      null,
      () => ''
    );
    column.hideHeader = true;
    column.cellComponent = 'message-template-menu';
    column.cellProps = row => ({
      templates: (templates(row) || []).filter(template => template?.href),
      ariaLabel: options.ariaLabel || 'Open message templates'
    });
    return column;
  };
})();
