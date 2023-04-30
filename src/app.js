// import 'regenerator-runtime/runtime'

// import { scaleBand, ScaleBand, scaleLinear, extent, min, max, axisBottom, axisLeft, line, curveLinear, easeCubic } from "d3";
// import { select, selectAll } from "d3-selection";
// import { group, groups } from "d3-array";
// import { extent, min, max } from "d3";

import * as d3 from "d3";

import scrollama from "scrollama"; // or...
const colors = require('./colors');
const yAxisTickValues = require('./yAxisTicks');

// console.log(yAxisTickValues.tickValues0)



// const d3 = {
// 	select,
// 	selectAll,
// 	scaleLinear,
// 	group,
// 	groups,
// 	extent,
// 	min,
// 	max,
// 	axisBottom,
// 	axisLeft,
// 	line,
// 	curveLinear,
// 	easeCubic
// }

/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
//   margin = { top: 20, bottom: 50, left: 60, right: 60 };
margin = { top: 20, bottom: 25, left: 23, right: 60 };

const lineColors = {
	'overall' : 'blue',
	1 : 'blue',
	2 : colors.lightGrey,
	3 : colors.lightGrey,
	4 : colors.lightGrey,
	5 : colors.lightGrey,
}

// transitionDuration = 1500;
// startColor = colors.grey
// xAxisDates = []

  
// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale; // maybe move this to const -- won't change by data
let yScale;
let yAxis;
let xAxisGroup; // maybe move this to const -- won't change by data
let yAxisGroup;
let lineGen; //line generator function
let lines;
let rawDataSet; //raw dataset
let overallData; //data filtered by "overall" bucket
let startData; //"overall" data as five arrays for first line chart
let groupsData; //data grouped by pts_bin

// these are variables set up for use in the scrolly
const main = d3.select("main");
const scrolly = main.select("#scrolly");
const figure = scrolly.select("figure"); //sticky container outside of chart
const article = scrolly.select("article");
const step = article.selectAll(".step");
// console.log(step)
const scroller = scrollama(); // initialize the scrollama

// make an object that we can update in one place and call below
let parameters = {
	transitionDuration: 1500,
	startColor: colors.lightGrey,
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
		'Points per game, all NBA teams',
		'Points per game, all NBA teams',
		'Points per game, by NBA player scoring quintile',
		'Points per game, by NBA player scoring quintile',
		'Three-point shots made per game, by NBA player scoring quintile',
		'Assists per game, by NBA player scoring quintile'
	]
};

/* APPLICATION STATE */
let state = {
	data: [],
	step: 0, // + YOUR FILTER SELECTION
	yAxisMetric: [], // The data we want to chart each slide
  };
  
/* LOAD DATA */
// + SET YOUR DATA PATH
import('../data/20230429_20230326_quintiles_player_bins_with_overall.json').then(data => {
    // console.log("loaded data:", data);
    
	//set up datasets we'll use
	rawDataSet = data;
	// overallData = data.filter(d => d.pts_bin === 'overall');
	// groupsData = data.filter(d => d.pts_bin != 'overall')

	//start with overallData
	// state.data = data;

    init();
  })


/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in
function init() {

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
	// dataSets = [groupedChartData, groupedChartData, groupedChartData, groupedChartData]

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
		.domain(d3.extent(state.data.flat(), d => d.season_year))
		.range([margin.right, width - margin.left])

	yScale = d3.scaleLinear()
		// .domain([d3.min(state.data.flat(), d => d[state.yAxisMetric]), d3.max(state.data.flat(), d => d[state.yAxisMetric])])
		.domain(parameters.yDomains[state.step])
		.range([height - margin.top, margin.bottom])
  
	// + AXES
	xAxis = d3.axisBottom(xScale)

	yAxis = d3.axisLeft(yScale)
  
	// + UI ELEMENT SETUP
  
  
	// + CREATE SVG ELEMENT
	svg = d3.select("#chart-container")
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
		// .attr("stroke", colors.blue)
		.attr("stroke", d => lineColors[d[0].pts_bin])
		.attr("stroke-width", 0)
		// .attr("fake", d=> console.log(d[0].pts_bin))
  
  
	// draw(); // calls the draw function
  }
  
  /* DRAW FUNCTION */ 
  // MAYBE RENAME THIS TRANSITION
  // we call this every time there is an update to the data/state
  function draw() {
	// + FILTER DATA BASED ON STATE
	const stepData = state.data
	  // .filter(d => d.country === state.selection)
  
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

	d3.selectAll(".line")
		.data(state.data)
		.attr("data-name", d => d[0].pts_bin) // give each line a data-name attribute of its pts_bin
		// .attr("fake", d=> console.log(d[0].pts_bin))
		.transition()
		.ease(d3.easeCubic)
		.duration(parameters.transitionDuration)
			.attr("d",lineGen)
			.attr('stroke-width', 2.5)
			// .attr("stroke", function(d){ return lineColors[d[0].pts_bin] })
			.attr("stroke", d => lineColors[d[0].pts_bin])
		
  
  }

/* SCROLL INTERACTIONS */
function updateChartTitle(response) {
	if ((state.step === 2 || state.step === 4 || state.step === 5) && (response.direction == 'down')) {
		figure.select("#chart-title")
			.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 0)
		.transition()
			.duration(parameters.transitionDuration / 2)
			.style("opacity", 1)
			.text(parameters.chartTitles[state.step]);

	} else if ((state.step === 4 || state.step === 3 || state.step === 1) && (response.direction == 'up')) {
		figure.select("#chart-title")
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

	// transition chart
	draw();
}