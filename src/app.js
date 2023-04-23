import { scaleBand, ScaleBand } from "d3";
import * as d3 from "d3";
// import { json } from "d3";
import scrollama from "scrollama"; // or...

console.log('hello test')


/* CONSTANTS AND GLOBALS */
// const width = ,
//   height = ,
//   margin = ,
//   radius = ;


// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
// let svg;
// let xScale;
// let yScale; ...

// these are variables set up for use in the scrolly
const main = d3.select("main");
const scrolly = main.select("#scrolly");
const figure = scrolly.select("figure");
const article = scrolly.select("article");
const step = article.selectAll(".step");
console.log(step)
const scroller = scrollama(); // initialize the scrollama

/* APPLICATION STATE */
let state = {
	data: [],
	selection: "All", // + YOUR FILTER SELECTION
  };
  
/* LOAD DATA */
// + SET YOUR DATA PATH
import('../data/20230326_quintiles_player_bins.json').then(data => {
    console.log("loaded data:", data);
    state.data = data;
    init();
  })

/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in
function init() {
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
			debug: true
		})
		.onStepEnter(handleStepEnter);


	// + SCALES
  
  
	// + AXES
  
  
	// + UI ELEMENT SETUP
  
  
	// + CREATE SVG ELEMENT
	
  
	// + CALL AXES
  
  
	draw(); // calls the draw function
  }
  
  /* DRAW FUNCTION */
  // we call this every time there is an update to the data/state
  function draw() {
	// + FILTER DATA BASED ON STATE
	const filteredData = state.data
	  // .filter(d => d.country === state.selection)
  
	// + UPDATE SCALE(S), if needed
	
  
	// + UPDATE AXIS/AXES, if needed
  
  
	// UPDATE LINE GENERATOR FUNCTION
  
  
	// + DRAW LINE AND/OR AREA
	
  
  }

/* SCROLL INTERACTIONS */


// generic window resize listener event
function handleResize() {
	// 1. update height of step elements
	const stepH = Math.floor(window.innerHeight * 0.75);
	step.style("height", stepH + "px");

	const figureHeight = window.innerHeight / 2;
	const figureMarginTop = (window.innerHeight - figureHeight) / 2;

	figure
		.style("height", figureHeight + "px")
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
}