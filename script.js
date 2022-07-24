'use strict';
console.clear();

const w = 1200;
const h = 700;

const defaultData = "kickstarter";

const chart = d3.select("#chart").append("svg").
attr("width", w).
attr("height", h);

//Fade color scheme
const color = d3.scaleOrdinal(d3.schemeCategory10.map(function (clr) {
  clr = d3.rgb(clr);clr.opacity = 0.95;
  return clr;
}));

const treemap = d3.treemap().
size([w, h]).
paddingInner(1);

const data = {
  kickstarter: {
    url: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json',
    title: 'Kickstarter Pledges',
    description: 'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category' },

  videoGames: {
    url: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json',
    title: 'Video Game Sales',
    description: 'Top 100 Most Sold Video Games Grouped by Platform' },

  movies: {
    url: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json',
    title: 'Movie Sales',
    description: 'Top 100 Highest Grossing Movies Grouped By Genre' } };



const tip = d3.tip().
attr("class", "d3Tip").
attr("id", "tooltip").
html(d => d).
direction("s");

//BUTTONS
const buttonNames = ["Kickstarter", "Video Games", "Movies"];

const buttons = d3.select("form").
selectAll("input").
data(buttonNames).
enter().
append("input").
attr("type", "button").
attr("value", d => d).
attr("class", d => d === "Kickstarter" ? "buttonActive" : "button");

buttons.on("click", function () {
  let self = d3.select(this);

  //At any button click, clear highlight on all buttons and assign generic button class. 
  d3.selectAll("input").
  attr("class", "button");

  //Grab clicked button attr class
  let classBtn = self.attr("class");

  //Button styling @ toggle
  classBtn = classBtn === "buttonActive" ? "button" : "buttonActive";

  //Assign new class to button @ toggle
  self.attr("class", classBtn);

  //Grab button value 
  let valueBtn = self.attr("value");

  //Update treemap, passing button value as data type
  switch (valueBtn) {
    case "Video Games":
      updateTreemap("videoGames");
      break;
    case "Movies":
      updateTreemap("movies");
      break;
    default:
      updateTreemap("kickstarter");}

});

function plot(params) {
  //Default comparator is descending order based on data's input value attribute  
  let root = d3.hierarchy(params.json).
  sum(d => d.value).
  sort((a, b) => b.height - a.height || b.value - a.value);

  params.treemap(root);

  //At start of each plot, clear treemap first of all elements, including child elements within .cell
  //Cell exit() phase
  this.selectAll(".cell").
  data(root.leaves()).
  exit().
  remove();

  this.selectAll(".cell").selectAll("rect").
  data(root.leaves()).
  remove();

  this.selectAll(".cell").selectAll("text").
  data(root.leaves()).
  remove();

  //Create cell-- enter() phase 
  let cell = this.selectAll("g.cell").
  data(root.leaves()) //elements with no children
  .enter().
  append("g").
  classed("cell", true).
  merge(this.selectAll(".cell"));

  //Cell update() phase
  this.selectAll(".cell").transition().
  duration(800).
  attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

  //Rect, element within cell, update phase-- apply attributes. 
  cell.append("rect").
  classed("tile", true).
  attr("width", d => d.x1 - d.x0).
  attr("height", d => d.y1 - d.y0).
  attr("fill", d => color(d.data.category)).
  attr("data-category", d => d.data.category).
  attr("data-name", d => d.data.name).
  attr("data-value", d => d.data.value).
  on("mousemove", function (d, i) {
    let html = `<ul class="hover-text">
                        <li><span>Name:</span>${d.data.name}</li>
                        <li><span>Category:</span>${d.data.category}</li>
                        <li><span>Value:</span>${d.data.value}</li>
                     </ul>`;
    params.tooltip.attr("data-value", d.data.value).
    show(html);
  }).
  on("mouseout", function (d, i) {
    params.tooltip.hide();
  });

  const xText = 7;
  const yText = 15;
  const textSize = 15;

  //Text enter() / update() phase
  cell.append("text").
  classed("cell-text", true).
  selectAll("tspan").
  data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g)).
  enter().
  append("tspan").
  attr("x", xText).
  attr("y", (d, i) => yText + textSize * i).
  text(d => d);

  this.call(params.tooltip);

  //LEGEND
  const legendWidth = 800;
  const legendCellDim = 18;
  const legendColXMargin = 170;
  const legendColYMargin = 23;
  const legendNumRows = Math.floor(legendWidth / legendColXMargin);

  //Filter for unique category values, since there are multiple items with same category
  let legendCategories = root.leaves().map(d => d.data.category).
  filter((category, index, self) => self.indexOf(category) === index);

  //Clear previous legend
  d3.select("#legend").remove();

  //Create legend
  let legend = d3.select("main").
  append("svg").
  classed("legend", true).
  attr("id", "legend").
  attr("width", legendWidth);

  let legendItemGroup = legend.append("g").
  attr("transform", "translate(90, 25)") //position entire group of legend items
  .selectAll("g").
  data(legendCategories).
  enter().
  append("g").
  classed("legendItem", true).
  attr("transform", (d, i) => "translate(" + legendColXMargin * (i % legendNumRows) + ',' + (
  legendColYMargin * Math.floor(i / legendNumRows) + legendNumRows * Math.floor(i / legendNumRows)) +
  ")");

  legendItemGroup.append("rect").
  classed("legend-item", true).
  attr("width", legendCellDim).
  attr("height", legendCellDim).
  attr("fill", d => color(d));

  legendItemGroup.append("text").
  classed("legendText", true).
  text(d => d).
  attr("x", legendCellDim + 7).
  attr("y", legendCellDim - 3);
};

function updateTreemap(selectedData) {
  let url = data[selectedData].url;
  let title = data[selectedData].title;
  let description = data[selectedData].description;

  document.getElementById("title").innerHTML = title;
  document.getElementById("description").innerHTML = description;

  d3.json(url, (error, json) => {//url => json
    if (error) throw error;
    plot.call(chart, {
      json: json,
      treemap: treemap,
      tooltip: tip });

  });
}

updateTreemap(defaultData);