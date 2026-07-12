export const translations = {
  es: {
    // Nav
    nav_guides: "Guías",
    nav_new: "Nueva guía",
    nav_logout: "Cerrar sesión",

    // Dashboard
    dash_title: "Guías",
    dash_sub: "Gestiona y visualiza las guías de destino",
    btn_template: "Descargar plantilla",
    btn_import: "Importar Excel",
    btn_new: "+ Nueva guía",
    filter_search: "Filtrar por ciudad o edición...",
    filter_status: "Todos los estados",
    filter_collection: "Todas las colecciones",
    btn_search: "Buscar",
    btn_clear: "Limpiar",
    guide_updated: "Actualizado",
    guide_items: "items",
    guide_edit: "Editar",
    empty_no_guides: "No hay guías todavía.",
    empty_no_match: "No hay guías con esos filtros.",
    empty_hint: "Crea una nueva o importa desde Excel.",

    // GuideEdit
    edit_breadcrumb_home: "Dashboard",
    edit_breadcrumb_guides: "Guías",
    edit_config: "Config JSON",
    tab_cover: "Portada",
    tab_sections: "Secciones",
    tab_items: "Fichas",
    tab_media: "Media",
    tab_preview: "Preview",
    tab_cms: "CMS",
    tab_instagram: "Instagram",
    tab_ai: "IA",
    tab_export: "Exportar",

    // Login
    login_title: "Inicia sesión en tu cuenta",
    login_sub: "Introduce tus datos para acceder al panel",
    login_email: "Email",
    login_password: "Contraseña",
    login_btn: "Iniciar sesión",
    login_restricted: "Editor interno · acceso restringido",
    login_error_default: "Email o contraseña incorrectos",

    // Theme / Lang
    theme_light: "Modo claro",
    theme_dark: "Modo oscuro",
  },
  en: {
    nav_guides: "Guides",
    nav_new: "New guide",
    nav_logout: "Log out",

    dash_title: "Guides",
    dash_sub: "Manage and view destination guides",
    btn_template: "Download template",
    btn_import: "Import Excel",
    btn_new: "+ New guide",
    filter_search: "Filter by city or edition...",
    filter_status: "All statuses",
    filter_collection: "All collections",
    btn_search: "Search",
    btn_clear: "Clear",
    guide_updated: "Updated",
    guide_items: "items",
    guide_edit: "Edit",
    empty_no_guides: "No guides yet.",
    empty_no_match: "No guides match those filters.",
    empty_hint: "Create a new one or import from Excel.",

    edit_breadcrumb_home: "Dashboard",
    edit_breadcrumb_guides: "Guides",
    edit_config: "Config JSON",
    tab_cover: "Cover",
    tab_sections: "Sections",
    tab_items: "Items",
    tab_media: "Media",
    tab_preview: "Preview",
    tab_cms: "CMS",
    tab_instagram: "Instagram",
    tab_ai: "AI",
    tab_export: "Export",

    login_title: "Sign in to your account",
    login_sub: "Enter your credentials to access the panel",
    login_email: "Email",
    login_password: "Password",
    login_btn: "Sign in",
    login_restricted: "Internal editor · restricted access",
    login_error_default: "Wrong email or password",

    theme_light: "Light mode",
    theme_dark: "Dark mode",
  },
};

export function t(lang, key) {
  return translations[lang]?.[key] ?? translations.es[key] ?? key;
}
