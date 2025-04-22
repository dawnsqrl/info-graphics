let width = 800
let height = 800
let radius = Math.min(width, height) / 2 - 40
let radialMargin = 5
let angularMargin = 5
let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height])

d3.json('coding.json').then(dataset => {
    let nodes = dataset.nodes
    nodes.sort((i, j) => {
        if (i.type !== j.type) {
            let _ = typeData.map(_ => _.type)
            return _.indexOf(i.type) - _.indexOf(j.type)
        }
        if (i.category !== j.category) {
            let _ = categoryData.map(_ => _.category)
            return _.indexOf(i.category) - _.indexOf(j.category)
        }
        if (i.count !== j.count) {
            return j.count - i.count
        }
        return i.id - j.id
    })
    let nodeMatrix = []
    let arcScale = d3.scaleLinear()
        .domain(d3.extent(nodes, d => d.count))
        .range([1, 25])
    nodes.forEach((node, i) => {
        let _ = Array(nodes.length).fill(0)
        _[i] = arcScale(node.count)
        nodeMatrix.push(_)
    })

    let links = dataset.links
    let nodeChord = d3.chord().padAngle(angularMargin / radius)
    let nodeChords = nodeChord(nodeMatrix)
    let nodeArcs = nodeChords.map(_ => _.source)
    let linkChords = links.map(_ => {
        let nodeIndices = nodes.map(_ => _.id)
        return {
            source: nodeArcs[nodeIndices.indexOf(_.source)],
            target: nodeArcs[nodeIndices.indexOf(_.target)],
            relation: _.relation
        }
    })

    let typeChords = typeData.map(_ => ({
        type: _.type, startAngle: 2 * Math.PI, endAngle: 0
    }))
    for (let i = 0; i < nodes.length; i++) {
        let typeIndex = typeData.map(
            _ => _.type
        ).indexOf(nodes[i].type)
        typeChords[typeIndex].startAngle = Math.min(
            typeChords[typeIndex].startAngle, nodeChords.groups[i].startAngle
        )
        typeChords[typeIndex].endAngle = Math.max(
            typeChords[typeIndex].endAngle, nodeChords.groups[i].endAngle
        )
    }

    let typeArc = d3.arc()
        .outerRadius(radius)
        .innerRadius(radius - radialMargin * 2)
    let nodeArc = d3.arc()
        .outerRadius(radius - radialMargin * 3)
        .innerRadius(radius - radialMargin * 5)
    let ribbon = d3.ribbon()
        .radius(radius - radialMargin * 6)

    let typeEnter = svg.append('g').selectAll('.chord')
        .data(typeChords).enter()
        .append('path')
        .attr('class', 'chord type')
        .style('fill', d => getTypeColor(d.type))
        .attr('d', typeArc)

    let nodeEnter = svg.append('g').selectAll('.chord')
        .data(nodeChords.groups).enter()
        .append('path')
        .attr('class', 'chord node')
        .style('fill', d => getCategoryColor(nodes[d.index].category, true))
        .attr('d', nodeArc)

    let linkEnter = svg.append('g').selectAll('.ribbon')
        .data(linkChords).enter()
        .append('path')
        .attr('class', 'ribbon')
        .style('fill', d => getLinkColor(d.relation))
        .attr('d', ribbon)

    let typeTipStyle = {
        Meaning: ['e', [0, 10]],
        Example: ['s', [40, 0]],
        Comparison: ['n', [40, -100]]
    }
    let typeTip = d3.tip()
        .direction(d => typeTipStyle[d.type][0])
        .attr('class', 'd3-tip')
        .offset(d => typeTipStyle[d.type][1])
        .html(d => `<div>
<p>Code Type: <em>${d.type}</em></p>
</div>`)
    svg.call(typeTip)
    typeEnter.on('mouseover', e => {
        typeTip.show(e)
        nodeEnter
            .filter(d => nodes[d.index].type !== e.type)
            .classed('blur', true)
        linkEnter
            .classed('blur', true)
        typeEnter
            .filter(d => d.type !== e.type)
            .classed('blur', true)
    }).on('mouseout', e => {
        typeTip.hide(e)
        nodeEnter
            .filter(d => nodes[d.index].type !== e.type)
            .classed('blur', false)
        linkEnter
            .classed('blur', false)
        typeEnter
            .filter(d => d.type !== e.type)
            .classed('blur', false)
    })

    let nodeTip = d3.tip().direction('e')
        .attr('class', 'd3-tip')
        .offset([0, 12])
        .html(d => {
            d = nodes[d.index]
            return `<div>
<p>Code #${d.id}</p>
<p><em>${d.code}${d.code.endsWith('.') ? '' : '.'}</em></p>
<p class='fade'>Code Type: <em>${d.type}</em></p>
<p class='fade'>Category: <em>${d.category}</em></p>
<p class='fade'>Occurrences: ${d.count}</p>
</div>`
        })
    svg.call(nodeTip)
    nodeEnter.on('mouseover', e => {
        nodeTip.show(e)
        nodeEnter
            .filter(d => d.index !== e.index)
            .classed('blur', true)
        linkEnter
            .filter(d => ![d.source.index, d.target.index].includes(e.index))
            .classed('blur', true)
    }).on('mouseout', e => {
        nodeTip.hide(e)
        nodeEnter
            .filter(d => d.index !== e.index)
            .classed('blur', false)
        linkEnter
            .filter(d => ![d.source.index, d.target.index].includes(e.index))
            .classed('blur', false)
    })

    let linkTip = d3.tip().direction('e')
        .attr('class', 'd3-tip')
        .offset([0, 12])
        .html(d => {
            let source = nodes[d.source.index]
            let target = nodes[d.target.index]
            return `<div>
<p>Code #${source.id} is <em>${d.relation.toLowerCase()} to</em> code #${target.id}</p>
</div>`
        })
    svg.call(linkTip)
    linkEnter.on('mouseover', e => {
        linkTip.show(e)
        nodeEnter
            .filter(d => ![e.source.index, e.target.index].includes(d.index))
            .classed('blur', true)
        linkEnter
            .filter(d => [d.source.index, d.target.index].some(
                _ => ![e.source.index, e.target.index].includes(_)
            ))
            .classed('blur', true)
    }).on('mouseout', e => {
        linkTip.hide(e)
        nodeEnter
            .filter(d => ![e.source.index, e.target.index].includes(d.index))
            .classed('blur', false)
        linkEnter
            .filter(d => [d.source.index, d.target.index].some(
                _ => ![e.source.index, e.target.index].includes(_)
            ))
            .classed('blur', false)
    })
})
