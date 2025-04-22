let width = 1200
let height = 800
let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)

let useHorizontalClustering = true
let alphaTarget = 0.3
let linkStrength = 2
let linkDistance = 50
let linkDistanceCompensationFactor = 1
let clusterAttractionStrength = -1
let clusterRepulsionStrength = 4
let clusterInversionThreshold = 300
let clusterIgnoreThreshold = 10
let collideRadiusFactor = 4
let xStrength = 0.1
let yStrength = xStrength * 0.8

function countType(nodes, type) {
    return nodes.filter(_ => _.type === type).length
}

d3.json('coding.json').then(dataset => {
    let nodes = dataset.nodes
    let links = dataset.links
    typeData.forEach(_ => _.count = countType(nodes, _.type))

    let typeGroup = svg.append('g').attr('class', 'types')
    let linkGroup = svg.append('g').attr('class', 'links')
    let nodeGroup = svg.append('g').attr('class', 'nodes')

    let radiusScale = d3.scaleSqrt()
        .domain(d3.extent(nodes, d => d.count))
        .range([5, 20])
    let colorScale = d3.scaleOrdinal(
        categoryData.map(d => d.category),
        categoryData.map(d => getCategoryColor(d.category))
    )
    let borderScale = d3.scaleOrdinal(
        typeData.map(d => d.type),
        typeData.map(d => getTypeColor(d.type))
    )
    let nodeEnter = nodeGroup.selectAll('.node')
        .data(nodes).enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', d => radiusScale(d.count))
        .style('fill', d => colorScale(d.category))
        .style('stroke', d => borderScale(d.type))

    let linkScale = d3.scaleOrdinal(
        linkData.map(d => d.relation),
        linkData.map(d => getLinkColor(d.relation))
    )
    svg.append('defs').selectAll('marker')
        .data(linkData).enter()
        .append('marker')
        .attr('id', d => `marker-${d.relation}`)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 9)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('fill', d => getLinkColor(d.relation))
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    let linkEnter = linkGroup.selectAll('g')
        .data(links).enter()
        .append('g')
    linkEnter.append('line')
        .attr('class', 'link')
        .attr('stroke', d => linkScale(d.relation))
        .attr('marker-end', d => `url(#marker-${d.relation})`)
    linkEnter.append('line')
        .attr('class', 'link hitbox')

    let typeRadiusScale = d3.scaleSqrt()
        .domain(d3.extent(typeData, d => d.count))
        .range([150, 250])
    let typeEnter = typeGroup.selectAll('g')
        .data(typeData).enter()
        .append('circle')
        .attr('class', 'type')
        .attr('r', d => typeRadiusScale(d.count))
        .style('fill', d => d.color)
        .style('opacity', 0)

    let simulation = d3.forceSimulation()
        .force('link', d3.forceLink()
            .id(d => d.id)
            .strength(d => d.relation === 'Contrary' ? linkStrength / 2 : linkStrength)
            .distance(
                d => linkDistance + (
                    radiusScale(d.source.count) + radiusScale(d.target.count)
                ) * linkDistanceCompensationFactor
            )
        )
        // .force('charge', d3.forceManyBody().distanceMin(10).strength(-100)
        .force('cluster', alpha => {
            nodes.forEach(i => { // self
                nodes.forEach(j => { // other
                    if (i.id <= j.id) return
                    let dx = j.x - i.x
                    let dy = j.y - i.y
                    let d = Math.sqrt(dx ** 2 + dy ** 2)
                    let ax = dx * alpha / 1000
                    let ay = dy * alpha / 1000
                    if (d < clusterIgnoreThreshold) return
                    if (d < clusterInversionThreshold) {
                        ax *= clusterRepulsionStrength
                        ay *= clusterRepulsionStrength
                    } else {
                        ax *= clusterAttractionStrength
                        ay *= clusterAttractionStrength
                    }
                    if (i.type !== j.type) {
                        ax *= -1
                        ay *= -1
                    }
                    i.vx += ax
                    i.vy += ay
                })
            })
        })
        .force('collide', d3.forceCollide(d => radiusScale(d.count) * collideRadiusFactor))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX(d => {
            if (useHorizontalClustering) {
                switch (d.type) {
                    case 'Meaning':
                        return width / 4
                    case 'Example':
                        return width / 2
                    case 'Comparison':
                        return width * 3 / 4
                }
            } else {
                return width / 2
            }
        }).strength(xStrength))
        .force('y', d3.forceY(height / 2).strength(yStrength))

    // x and y fields belong to node objects and are added by the simulation
    simulation.nodes(nodes).on('tick', () => {
        linkEnter.selectAll('.link')
            .attr('x1', d => getLinkSourceX(d, radiusScale))
            .attr('y1', d => getLinkSourceY(d, radiusScale))
            .attr('x2', d => getLinkTargetX(d, radiusScale))
            .attr('y2', d => getLinkTargetY(d, radiusScale))
        nodeEnter
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
        typeEnter
            .attr('cx', 400)
            .attr('cy', 400)
    })
    simulation.force('link').links(links)

    // alpha is the tendency of continuing simulation
    let drag = d3.drag()
        .on('start', d => {
            if (!d3.event.active) simulation.alphaTarget(alphaTarget).restart()
            d.fx = d.x
            d.fy = d.y
        })
        .on('drag', d => {
            nodeGroup.selectAll('.node').classed('blur', false)
            linkGroup.selectAll('.link').classed('blur', false)
            d.fx = d3.event.x
            d.fy = d3.event.y
        })
        .on('end', d => {
            if (!d3.event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
        })
    nodeEnter.call(drag)

    let nodeTip = d3.tip().direction('s')
        .attr('class', 'd3-tip')
        .offset([12, 0])
        .html(d => `<div>
<p>Code #${d.id}</p>
<p><em>${d.code}${d.code.endsWith('.') ? '' : '.'}</em></p>
<p class='fade'>Code Type: <em>${d.type}</em></p>
<p class='fade'>Category: <em>${d.category}</em></p>
<p class='fade'>Occurrences: ${d.count}</p>
</div>`)
    svg.call(nodeTip)
    nodeEnter.on('mouseover', e => {
        nodeTip.show(e)
        nodeGroup.selectAll('.node')
            .filter(d => d.id !== e.id)
            .classed('blur', true)
        linkGroup.selectAll('.link')
            .filter(d => ![d.source.id, d.target.id].includes(e.id))
            .classed('blur', true)
    }).on('mouseout', e => {
        nodeTip.hide(e)
        nodeGroup.selectAll('.node')
            .filter(d => d.id !== e.id)
            .classed('blur', false)
        linkGroup.selectAll('.link')
            .filter(d => ![d.source.id, d.target.id].includes(e.id))
            .classed('blur', false)
    })

    let linkTip = d3.tip().direction('s')
        .attr('class', 'd3-tip')
        .offset([20, 0])
        .html(d => `<div>
<p>Code #${d.source.id} is <em>${d.relation.toLowerCase()} to</em> code #${d.target.id}</p>
</div>`)
    svg.call(linkTip)
    linkEnter.on('mouseover', e => {
        linkTip.show(e)
        nodeGroup.selectAll('.node')
            .filter(d => ![e.source.id, e.target.id].includes(d.id))
            .classed('blur', true)
        linkGroup.selectAll('.link')
            .filter(d => [d.source.id, d.target.id].some(
                _ => ![e.source.id, e.target.id].includes(_)
            ))
            .classed('blur', true)
    }).on('mouseout', e => {
        linkTip.hide(e)
        nodeGroup.selectAll('.node')
            .filter(d => ![e.source.id, e.target.id].includes(d.id))
            .classed('blur', false)
        linkGroup.selectAll('.link')
            .filter(d => [d.source.id, d.target.id].some(
                _ => ![e.source.id, e.target.id].includes(_)
            ))
            .classed('blur', false)
    })

    setInterval(
        () => d3.selectAll('#alpha').text(
            `alpha = ${simulation.alpha().toFixed(4)}`
        ), 10
    )
})

function getLinkDistance(d) {
    let dx = d.target.x - d.source.x
    let dy = d.target.y - d.source.y
    return [dx, dy, Math.sqrt(dx ** 2 + dy ** 2)]
}

function getLinkSource(d, scale) {
    let [dx, dy, h] = getLinkDistance(d)
    let r = scale(d.source.count)
    return [
        d.source.x + r / h * dx,
        d.source.y + r / h * dy
    ]
}

function getLinkTarget(d, scale) {
    let [dx, dy, h] = getLinkDistance(d)
    let r = scale(d.target.count)
    return [
        d.target.x - r / h * dx,
        d.target.y - r / h * dy
    ]
}

function getLinkSourceX(d, scale) {
    return getLinkSource(d, scale)[0]
}

function getLinkSourceY(d, scale) {
    return getLinkSource(d, scale)[1]
}

function getLinkTargetX(d, scale) {
    return getLinkTarget(d, scale)[0]
}

function getLinkTargetY(d, scale) {
    return getLinkTarget(d, scale)[1]
}
