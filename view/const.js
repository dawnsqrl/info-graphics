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

function getNodeTooltip(id, code, type, category, count) {
    return `<div>
<p>Code #${id}</p>
<p><em>${code}${code.endsWith('.') ? '' : '.'}</em></p>
<p class='fade'>Code Type: <em>${type}</em></p>
<p class='fade'>Category: <em>${category}</em></p>
<p class='fade'>Paper Occurrences: ${count}</p>
</div>`
}

function getLinkTooltip(source_id, target_id, relation) {
    return `<div>
<p>Code #${source_id} is <em>${relation.toLowerCase()} to</em> code #${target_id}</p>
</div>`
}

function getTypeTooltip(type, nodes) {
    return `<div>
<p>Code Type: <em>${type}</em></p>
<p class='fade'>${nodes.filter(d => d.type === type).length} Codes</p>
</div>`
}
