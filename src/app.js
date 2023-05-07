import * as d3 from "d3";
// console.log(d3);

import scrollama from "scrollama"; // or...
const colors = require('./colors');
const yAxisTickValues = require('./yAxisTicks');


/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.7,
	  height = window.innerHeight * 0.7,
	  heightBar = window.innerHeight * 0.95,
	  margin = { top: 20, bottom: 25, left: 23, right: 60 }, 
	  marginBar = { top: 20, bottom: 25, left: 32, right: 60 };

const lineColors = {
	'overall' : colors.orange3,
	1 : colors.teal4,
	2 : colors.orange1,
	3 : colors.orange2,
	4 : colors.orange3,
	5 : colors.orange4,
}
  
// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale; 
let yScale;
let yAxis;
let xAxisGroup; 
let yAxisGroup;
let lineGen; //line generator function
let lines;
let rawDataSet; //raw dataset
let overallData; //data filtered by "overall" bucket
let startData; //"overall" data as five arrays for first line chart
let groupsData; //data grouped by pts_bin
let topPlayersLabelGroup; //svg group for line label
let topPlayersTextLabel; //text for line label
let bottomPlayersLabelGroup;
let bottomPlayersTextLabel;

//for bar chart
let svgBar;
let xScaleBar; 
let yScaleBar;
let xAxisBarTop;
let xAxisBarBottom;
let yAxisBar;
let xAxisGroupBarTop;
let xAxisGroupBarBottom; 
let yAxisGroupBar;
let bars;
let barSegments;
let tooltip;
let tooltipBar;

// these are variables set up for use in the scrolly
const main = d3.select("main");
const scrolly = main.select("#scrolly");
const figure = scrolly.select("figure"); //sticky container outside of chart
const article = scrolly.select("article");
const step = article.selectAll(".step");
const scroller = scrollama(); // initialize the scrollama

// make an object with settings we can update in one place and call below
let parameters = {
	transitionDuration: 1250,
	startColor: colors.lightGrey,
	xDomain: [1977, 2024],
	xTickValues: [1980, 1990, 2000, 2010, 2020],
	xTickLabels: ['1980', '\'90', '2000', '\'10', '\'20'],
	yDomains: [
		yAxisTickValues.domain0,
		yAxisTickValues.domain1,
		yAxisTickValues.domain2,
		yAxisTickValues.domain3,
		yAxisTickValues.domain4,
		yAxisTickValues.domain5,
	],
	yTickValues: [
		yAxisTickValues.tickValues0,
		yAxisTickValues.tickValues1,
		yAxisTickValues.tickValues2,
		yAxisTickValues.tickValues3,
		yAxisTickValues.tickValues4,
		yAxisTickValues.tickValues5,
	],
	chartTitles: [
		"Points per game, all NBA teams",
		"Points per game, all NBA teams",
		"Points per game, by tier of NBA scorers",
		"Points per game, by tier of NBA scorers",
		"Three-point shots made per game, by tier of NBA scorers",
		"Assists per game, by tier of NBA scorers"
	],
	lineLabelXValue: 2023,
	topPlayersLabelYValues: [100, 100, 22.85, 22.85, 2.16, 4.9],
	bottomPlayersLabelYValues: [100, 100, 3.95, 3.95, 0.48, 0.98],
	xTickValuesBars: [0, 5, 10, 15, 20, 25],
	yTickValueBars: yAxisTickValues.yTickValuesBars,
	yTickLabelBars: yAxisTickValues.yTickLabelBars
};

/* APPLICATION STATE */
let state = {
	data: [],
	step: 0, // + YOUR FILTER SELECTION
	yAxisMetric: [], // The data we want to chart each slide
  };
  
/* LOAD DATA */
// + SET YOUR DATA PATH
Promise.all([
		import('../data/final_quintiles_player_bins_with_overall.json'),
		import('../data/50_pt_games_formatted.json')
	]).then(([data, barData]) => {
    
    rawDataSet = data;
	barDataSet = barData;

    init();

  });


/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in
function init() {

	//////////////////////////////////////////
	//////////// SCROLLY LINES ///////////////
	//////////////////////////////////////////

	//SET UP DATASETS WE WILL USE
	//overall data
	overallData = rawDataSet.filter(d => d.pts_bin === 'overall');
	startData = new Array(5).fill(overallData) //for charting

	//pts_bin data
	groupsData = rawDataSet.filter(d => d.pts_bin != 'overall')
	groupedData = d3.groups(groupsData, d => d.pts_bin)

	let groupedChartData = [] //for charting
	groupedData.forEach(element => groupedChartData.push(element[1]));

	//put these in an array which we will cycle through based on the scrolly step
	dataSets = [startData, groupedChartData, groupedChartData, groupedChartData, groupedChartData]

	//start with startData
	state.data = startData;

	//SET UP STRINGS WE'LL USE FOR CHOOSING THE Y-AXIS METRIC
	yAxisMetrics = ['ppg', 'ppg', 'ppg', '3p_game', 'ast_game']
	state.yAxisMetric = 'ppg'


	// SCROLLAMA
	// 1. force a resize on load to ensure proper dimensions are sent to scrollama
	handleResize();

	// 2. setup the scroller passing options
	// 		this will also initialize trigger observations
	// 3. bind scrollama event handlers (this can be chained like below)
	scroller
		.setup({
			step: "#scrolly article .step",
			offset: 0.7,
			debug: false
		})
		.onStepEnter(handleStepEnter);


	// + SCALES
	xScale = d3.scaleLinear()
		.domain(parameters.xDomain)
		.range([margin.right, width - margin.left])

	yScale = d3.scaleLinear()
		.domain(parameters.yDomains[state.step])
		.range([height - margin.top, margin.bottom])
  
	// + AXES
	xAxis = d3.axisBottom(xScale)

	yAxis = d3.axisLeft(yScale)
  
	// + CREATE SVG ELEMENT
	svg = d3.select("#line-chart-container")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
  
	// + CALL AXES
	xAxisGroup = svg.append("g")
		.attr("transform", `translate(${0}, ${height - margin.bottom + 5})`)
		.attr('class', 'x-axis-group')
		.call(xAxis
			.tickValues(parameters.xTickValues)
			.tickPadding(5)
			// .tickFormat(d => d)
			.tickFormat(function(d, i){
				return parameters.xTickLabels[i];
			})
			)
	
	yAxisGroup = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr('class', 'y-axis-group')
		.call(yAxis
			.tickValues(parameters.yTickValues[state.step])
			.tickSizeInner(-width)
			.tickPadding(5)
		)
	
	// LINE GENERATOR FUNCTION
	// Our initial line should use startData, which is overall data on ppg but drawn five times (for splitting later)
	lineGen = d3.line()
		.x(d => xScale(d.season_year))
		.y(d => yScale(d[state.yAxisMetric]))
		.curve(d3.curveLinear)
  
	// + DRAW LINE AND/OR AREA
	lines = svg.selectAll(".line")
		.data(state.data)
		.join("path")
		.attr("d",lineGen)
		.attr("class", 'line')
		.attr("data-name", d => d[0].pts_bin) // give each line a data-name attribute of its pts_bin
		.attr("fill", "none")
		.attr("stroke", d => lineColors[d[0].pts_bin])
		.attr("stroke-width", 0)
		// .attr("fake", d=> console.log(d[0].pts_bin))

	// ADD LINE LABELS -- with opacity 0 for now. Fade in based on slide numbers
	topPlayersLabelGroup = svg.append("g")
		.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.topPlayersLabelYValues[state.step])})`)
		.attr("class", "line-label")
		.style("opacity", 0)
	
	topPlayersTextLabel = topPlayersLabelGroup.append("text")
		.text("Top 20% of scorers")
		.attr("x", 0)
		.attr("y", 5)
		.attr("fill", colors.teal4)

	bottomPlayersLabelGroup = svg.append("g")
		.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.bottomPlayersLabelYValues[state.step])})`)
		.attr("class", "line-label")
		.style("opacity", 0)
	
	bottomPlayersTextLabel = bottomPlayersLabelGroup.append("text")
		.text("Bottom 20% of scorers")
		.attr("x", 0)
		.attr("y", 5)
		.attr("fill", colors.orange2)
  


  	//////////////////////////////////////////
	//////////// STACKED BAR /////////////////
	//////////////////////////////////////////
	
	//STACK DATA FOR CHART
	const barColumns = Object.keys(barDataSet[0]) // array with season_year and then player names

	series = d3.stack()
		.keys(barColumns.slice(1))
		.order(d3.stackOrderDescending)
		(barDataSet)
		.map(d => (d.forEach(v => v.key = d.key), d))
	
	// + SCALES
	xScaleBar = d3.scaleLinear()
		.domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
		.range([marginBar.left, width - marginBar.right])

	yScaleBar = d3.scaleBand()
		.domain(barDataSet.map(d => d.season_year))
		.range([marginBar.top, heightBar - marginBar.bottom])
		.padding(0.08)
  
	// + CREATE SVG ELEMENT
	svgBar = d3.select("#bar-chart-container")
		.append("svg")
		.attr("width", width)
		.attr("height", heightBar)
  
	// DRAW BARS
	drawBars();	
  }

  // Function to format the class names we'll give each bar segment
	function keyFormatter(key) {
		let noSpaces = key.replace(/\s+/g, '-',).toLowerCase()
		let noPeriods = noSpaces.replace(/\./g,'')
		let noApostrophes = noPeriods.replace(/'/g,'')

		return noApostrophes
	};

  	function drawBars() {
	
	// AXES (before drawing bars so that gridlines are on bottom)
	xAxisBarTop = d3.axisTop(xScaleBar)
	xAxisBarBottom = d3.axisBottom(xScaleBar)

	yAxisBar = d3.axisLeft(yScaleBar)
	
  
	// + CALL AXES 
	xAxisGroupBarTop = svgBar.append("g")
		.attr("transform", `translate(${0}, ${marginBar.top})`)
		.attr('class', 'x-axis-group-bars')
		.call(xAxisBarTop
			.tickValues(parameters.xTickValuesBars)
			.tickPadding(5)
			.tickSizeInner(-heightBar+marginBar.bottom+10)
			)

	xAxisGroupBarBottom = svgBar.append("g")
		.attr("transform", `translate(${0}, ${heightBar - marginBar.bottom + 5})`)
		.attr('class', 'x-axis-group-bars')
		.call(xAxisBarBottom
			.tickValues(parameters.xTickValuesBars)
			.tickPadding(5)
			)

	yAxisGroupBar = svgBar.append("g")
		.attr("transform", `translate(${marginBar.left},0)`)
		.attr('class', 'y-axis-group')
		.call(yAxisBar
			.tickSizeInner(0)
			.tickPadding(5)
			.tickValues(parameters.yTickValueBars)
			.tickFormat(function(d, i){
				return parameters.yTickLabelBars[i];
			})
		)

	// DRAW BARS
	bars = svgBar.append("g")
		.selectAll("g")
		.data(series)
		.join("g")
			.attr("fill", colors.teal4)
			.attr('stroke', 'white')
			.attr('stroke-width', 1.25)
			.attr('class', 'bars')
		.selectAll("rect")
		.data(d => d)
		.join("rect")
			.attr("x", d => xScaleBar(d[0]))
			.attr("y", (d, i) => yScaleBar(d.data.season_year))
			// .attr("rx", 4.5)
			.attr("width", d => xScaleBar(d[1]) - xScaleBar(d[0]))
			.attr("height", yScaleBar.bandwidth())
			.attr("class", d => keyFormatter(d.key))

	// ANNOTATION
	const segmentAnnotationLine = svgBar.append("line")
		.attr("x1", xScaleBar(11.5))
		.attr("x2", xScaleBar(11.5))
		.attr("y1", yScaleBar(1991) + (yScaleBar.bandwidth()/8)) 
		.attr("y2", yScaleBar(1993) + (yScaleBar.bandwidth()/4))
		.attr("stroke", "#171717")
		.attr("stroke-width", 1.5)
		.attr("class", "static-zero-line")
		.attr('marker-end', 'url(#arrow)')

	const segmentAnnotationTextGroup = svgBar.append("g")
		.attr("transform", `translate(${xScaleBar(11)}, ${yScaleBar(1994)})`)
		.attr("class", "segment-annotation")
	
	const segmentAnnotationText = segmentAnnotationTextGroup.append("text")
		.text("Each segment")
		.attr("y", 6)
	
	segmentAnnotationTextGroup.append("text")
		.text("represents a player")
		.attr("y", +23)

	d3.selectAll('.dale-ellis')
		.attr('stroke', '#171717')
		.attr('stroke-width', '2px')
		.style('mix-blend-mode', 'multiply')

	d3.selectAll('.terry-cummings')
		.attr('stroke', '#ffffff')
		.style('mix-blend-mode', 'multiply')
	
	// MAKE INVISIBLE TOOLTIP
	tooltip = d3.select("body").append("div")
		.attr("class", "svg-tooltip")
		.style("position", "absolute")
		.style("visibility", "hidden")
		.text("");

	// FIRE TOOLTIPS
	svgBar.selectAll('rect')
		.on("mouseover",(event, d)=>{
			onMouseEnter(event, d);
		})
		.on("mouseleave",(event, d)=>{
			onMouseLeave(event, d);
		})
  };

  function onMouseEnter(event, d) {
	//highlight bar segments
	let hoveredRectClass = keyFormatter(d.key)
	d3.selectAll('.' + hoveredRectClass)
    .attr('fill', '#8edede')

	//update tooltip
	tooltip
		.style("visibility", "visible")
		.style("top", (event.pageY+10)+"px")
		.style("left",(event.pageX+10)+"px")

	d3.selectAll('.svg-tooltip')
		.text(d.key + ', ')
		.append(('text'))
		.text(d.data.season_year + ': ' )
		.append(('text'))
		.text(d[1] - d[0] + ' game(s)')
	
  };

  function onMouseLeave(event, d) {
	//remove highlight on bar segments
	let hoveredRectClass = keyFormatter(d.key)
	d3.selectAll('.' + hoveredRectClass)
    .attr('fill', colors.teal4)

	//hide tooltip
	tooltip
		.style("visibility", "hidden")
	
  };

	
  
  /* TRANSITION FUNCTION */ 
  // we call this every time there is an update to the step
  function draw(response) {
	// + FILTER DATA BASED ON STATE
	const stepData = state.data

	// + UPDATE SCALE(S), if needed
	yScale.domain(parameters.yDomains[state.step])
	
	// + UPDATE AXIS/AXES, if needed
	yAxisGroup
		.transition()
		.duration(parameters.transitionDuration)
		.call(yAxis
			.scale(yScale)
			.tickValues(parameters.yTickValues[state.step])
	);
	
	// UPDATE LINES
	d3.selectAll(".line")
		.data(state.data)
		.attr("data-name", d => d[0].pts_bin) // give each line a data-name attribute of its pts_bin
		.transition()
		.ease(d3.easeCubic)
		.duration(parameters.transitionDuration)
			.attr("d",lineGen)
			.attr('stroke-width', 2.5)
			.attr("stroke", d => lineColors[d[0].pts_bin])
	
	// UPDATE LINE LABELS
	updateLineLabels(response);
  };


/* SCROLL INTERACTIONS */
function updateChartTitle(response) {
	if ((state.step === 2 || state.step === 4 || state.step === 5) && (response.direction == 'down')) {
		
		figure.select("#line-chart-title")
			.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 0)
		.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 1)
			.text(parameters.chartTitles[state.step]);

	} else if ((state.step === 4 || state.step === 3 || state.step === 1) && (response.direction == 'up')) {
		
		figure.select("#line-chart-title")
			.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 0)
		.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 1)
			.text(parameters.chartTitles[state.step]);

	} else {
		// pass
	};
};

function updateLineLabels(response) {

	if ((state.step === 2) && (response.direction == 'down')) {

		topPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.topPlayersLabelYValues[state.step])})`)
			.style("opacity", 1)
		
		bottomPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.bottomPlayersLabelYValues[state.step])})`)
			.style("opacity", 1)
		
	} else if ((state.step === 4 || state.step === 5 ) && (response.direction === 'down' || response.direction === 'up')) {
		topPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.topPlayersLabelYValues[state.step])})`)

		bottomPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.bottomPlayersLabelYValues[state.step])})`)

	} else if ((state.step === 3) && (response.direction === 'up')) {
		topPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.topPlayersLabelYValues[state.step])})`)

		bottomPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.bottomPlayersLabelYValues[state.step])})`)

	} else if ((state.step === 1 ) && (response.direction === 'up')) {
		topPlayersLabelGroup
			.transition()
			.duration(parameters.transitionDuration)
				.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.topPlayersLabelYValues[state.step])})`)
				.style("opacity", 0)

		bottomPlayersLabelGroup
		.transition()
		.duration(parameters.transitionDuration)
			.attr("transform", `translate(${xScale(parameters.lineLabelXValue)}, ${yScale(parameters.bottomPlayersLabelYValues[state.step])})`)
			.style("opacity", 0)
	} else {
		// pass
	};
};


function highlightTopAndBottom() {
	svg.selectAll("[data-name='1']")
		.transition()
		.ease(d3.easeBackIn)
		.delay(1000) 
		.duration(400)
    	.attr("stroke-width", "7")

	svg.selectAll("[data-name='5']")
		.transition()
		.ease(d3.easeBackIn)
		.delay(1000) 
		.duration(400)
    	.attr("stroke-width", "7")
};

// generic window resize listener event
function handleResize() {
	// 1. update height of step elements
	// const stepH = Math.floor(window.innerHeight * 0.5);
	// step.style("height", stepH + "px");

	// const figureHeight = window.innerHeight / 2;
	// const figureMarginTop = (window.innerHeight - figureHeight) / 2;
	const figureMarginTop = (window.innerHeight - height) / 2;

	figure
		.style("height", height + "px")
		.style("width", width + "px")
		.style("top", figureMarginTop + "px");

	// 3. tell scrollama to update new element dimensions
	scroller.resize();
}

function handleStepEnter(response) {
	// response = { element, direction, index }

	// add color to current step only
	step.classed("is-active", function (d, i) {
		return i === response.index;
	});

	// update step
	state.step = response.index + 1;
	console.log(state.step);

	//update chart title based on step
	updateChartTitle(response);

	// update data based on step
	state.data = dataSets[response.index] //dataset -- we may be able to remove this later
	state.yAxisMetric = yAxisMetrics[response.index] //y axis metric

	// transition lines
	draw(response);

	// step-specific transitions
	if (state.step === 3) {
		highlightTopAndBottom();
	} else {
		// pass
	};
}