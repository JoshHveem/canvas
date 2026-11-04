export function addToModuleMenu(name, description, action, icon = 'icon-plus') {
  const courseId = ENV.COURSE_ID;
  $('div.context_module').each(function () {
    const module = $(this);
    const moduleId = module.attr('data-module-id');
    module.find('div.ig-header-admin').each(function () {
      const item = $(this);
      const menu = item.find('ul.al-options');
      if (menu.find('[data-btech-menu-action]').filter(function () {
        return $(this).attr('data-btech-menu-action') === name;
      }).length) return;
      const entry = $('<li role="presentation" class="module_group_menu ui-menu-item"></li>');
      entry.attr('data-btech-menu-action', name);
      const link = $('<a class="menu_tray_tool_link ui-corner-all" role="menuitem"></a>');
      link.attr('title', description);
      link.append($('<i></i>').addClass(icon));
      link.append(document.createTextNode(name));
      entry.append(link);
      menu.append(entry);
      link.on('click', event => action(event, courseId, moduleId, item));
    });
  });
}
