// import 'regenerator-runtime/runtime'

import { scaleBand, ScaleBand } from "d3";
// import * as d3 from "d3";
// const d3 = require('d3');



// import * as d3 from "d3";


// import { json } from "d3";
import scrollama from "scrollama"; // or...

console.log('hello test')


/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 60 };

  
// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale; // maybe move this to const -- won't change by data
let yScale;
let yAxis;
let xAxisGroup; // maybe move this to const -- won't change by data
let yAxisGroup;
let rawDataSet; //raw dataset
let overallData; //data filtered by "overall" bucket
let startData; //"overall" data as five arrays for first line chart
let groupsData; //data grouped by pts_bin
// let groupedChartData; //data grouped by pts_bin and formatted for charting

// these are variables set up for use in the scrolly
const main = d3.select("main");
const scrolly = main.select("#scrolly");
const figure = scrolly.select("figure"); //sticky container outside of chart
const article = scrolly.select("article");
const step = article.selectAll(".step");
console.log(step)
const scroller = scrollama(); // initialize the scrollama

/* APPLICATION STATE */
let state = {
	data: [],
	step: 0, // + YOUR FILTER SELECTION
  };
  
/* LOAD DATA */
// + SET YOUR DATA PATH
import('../data/20230326_quintiles_player_bins_with_overall.json').then(data => {
    console.log("loaded data:", data);
    
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
	dataSets = [startData, groupedChartData]

	//start with startData
	state.data = startData;

	// SCROLLAMA
	// 1. force a resize on load to ensure proper dimensions are sent to scrollama
	handleResize();

	// 2. setup the scroller passing options
	// 		this will also initialize trigger observations
	// 3. bind scrollama event handlers (this can be chained like below)
	scroller
		.setup({
			step: "#scrolly article .step",
			offset: 0.33,
			debug: false
		})
		.onStepEnter(handleStepEnter);


	// + SCALES
	xScale = d3.scaleLinear()
		.domain(d3.extent(state.data.flat(), d => d.season_year))
		.range([margin.right, width - margin.left])

	yScale = d3.scaleLinear()
		.domain([d3.min(state.data.flat(), d => d.ppg), d3.max(state.data.flat(), d => d.ppg)])
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
		.attr("class", "xAxis")
		.attr("transform", `translate(${0}, ${height - margin.bottom})`)
		.call(xAxis)
		.attr('class', 'x-axis-group')
	
	yAxisGroup = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.call(yAxis)
		.attr('class', 'y-axis-group')
  
  
	draw(); // calls the draw function
  }
  
  /* DRAW FUNCTION */
  // we call this every time there is an update to the data/state
  function draw() {
	// + FILTER DATA BASED ON STATE
	const stepData = state.data
	  // .filter(d => d.country === state.selection)
  
	// + UPDATE SCALE(S), if needed
	yScale.domain([d3.min(stepData.flat(), d => d.ppg), d3.max(stepData.flat(), d => d.ppg)]).nice()
  
	// + UPDATE AXIS/AXES, if needed
	yAxisGroup
		.transition()
		.duration(750)
		.call(yAxis.scale(yScale))// need to udpate the scale
  
	// LINE GENERATOR FUNCTION
	const lineGen = d3.line()
		.x(d => xScale(d.season_year))
		.y(d => yScale(d.ppg))
		.curve(d3.curveLinear)
  
	// + DRAW LINE AND/OR AREA
	const path = svg.selectAll(".line")
		.data(stepData)
		.join("path")
		.attr("d",lineGen)
		.attr("class", 'line')
		// .attr("data-name", d => d[0]) // give each line a data-name attribute of its series name
		.attr("fill", "none")
		.attr("stroke", "orange")
		.attr("stroke-width", 2.5)
		
  
  }

/* SCROLL INTERACTIONS */


// generic window resize listener event
function handleResize() {
	// 1. update height of step elements
	const stepH = Math.floor(window.innerHeight * 0.75);
	step.style("height", stepH + "px");

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
	console.log(response);
	// response = { element, direction, index }

	// add color to current step only
	step.classed("is-active", function (d, i) {
		return i === response.index;
	});

	// update graphic based on step
	figure.select("p").text(response.index + 1);

	// update data based on step
	state.data = dataSets[response.index]
	console.log(state.data)

	draw();
}