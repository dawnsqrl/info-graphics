const colorScheme = {
    'red': ['#b03737', '#ffcfc9'],
    'yellow': ['#a3804b', '#ffe5a0'],
    'green': ['#11734b', '#d4edbc'],
    'cyan': ['#215a6c', '#c6dbe1'],
    'blue': ['#0a53a8', '#bfe1f6'],
    'purple': ['#5a3286', '#e6cff2']
}

const linkData = [
    {'relation': 'Contrary', 'color': 'red'},
    {'relation': 'Related', 'color': 'yellow'},
    {'relation': 'Similar', 'color': 'green'}
]

const typeData = [
    {'type': 'Meaning', 'color': 'red'},
    {'type': 'Example', 'color': 'green'},
    {'type': 'Comparison', 'color': 'blue'}
]

const categoryData = [
    {'category': 'Design', 'color': 'blue'},
    {'category': 'Goal', 'color': 'red'},
    {'category': 'Content', 'color': 'yellow'},
    {'category': 'Authoring', 'color': 'green'},
    {'category': 'Application', 'color': 'purple'},
    {'category': 'Comparison', 'color': 'cyan'}
]

function getLinkColor(relation, foreground = true) {
    return colorScheme[linkData[linkData.map(
        _ => _.relation
    ).indexOf(relation)].color][foreground ? 0 : 1]
}

function getTypeColor(type, foreground = true) {
    return colorScheme[typeData[typeData.map(
        _ => _.type
    ).indexOf(type)].color][foreground ? 0 : 1]
}

function getCategoryColor(category, foreground = false) {
    return colorScheme[categoryData[categoryData.map(
        _ => _.category
    ).indexOf(category)].color][foreground ? 0 : 1]
}
