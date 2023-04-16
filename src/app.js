import { scaleBand, ScaleBand } from "d3";
// import * as d3 from "d3";
// import { json } from "d3";
import scrollama from "scrollama"; // or...

console.log('hello test')
console.log(scrollama)

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