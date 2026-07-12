CATEGORY_LABELS = {
    "restaurant": "Restaurante",
    "hotel": "Hotel",
    "activity": "Actividad",
    "bar": "Bar",
    "shop": "Tienda",
    "transport": "Transporte",
    "tip": "Consejo",
}

CATEGORY_ICONS = {
    "restaurant": "🍽",
    "hotel": "🏨",
    "activity": "🎯",
    "bar": "🍷",
    "shop": "🛍",
    "transport": "🚌",
    "tip": "💡",
}


def category_label(value: str) -> str:
    return CATEGORY_LABELS.get(value, value.capitalize())


def category_icon(value: str) -> str:
    return CATEGORY_ICONS.get(value, "•")


def format_rating(value: float) -> str:
    full = int(value)
    return "★" * full + "☆" * (5 - full)


def price_label(value: str) -> str:
    labels = {"€": "Económico", "€€": "Moderado", "€€€": "Caro", "€€€€": "Lujo"}
    return labels.get(value, value)


FILTERS = {
    "category_label": category_label,
    "category_icon": category_icon,
    "format_rating": format_rating,
    "price_label": price_label,
}
