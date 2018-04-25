// info needed for graph
var dataY = [],
    dataX = [],
    margin = {top: 40, right: 30, bottom: 80, left: 60},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.right - margin.left,
    barPadding = 10,
    xLabel = "Provincie",
    yLabel = "Aantal toeristen (x1000)",
    source = "CBS",
    titleGraph = "Aantal toeristen in 2016 per provincie";

// put information about graph before the bar chart
d3.select("head title")
    .text("Toeristen per provincie 2016");
d3.select("body")
    .append("p")
    .text("Kenneth Goei, 11850701");
d3.select("body")
    .append("p")
    .text("Staafdiagram welke het aantal toeristen per provincie in" +
          " Nederland laat zien in 2016. De data is afkomstig van het CBS.");

// load the json file and create the bar chart
d3.json("https://jantje676.github.io/dataprocessing/homework/week3/gasten.json", function(data)
{
    // split all the x- and y-values in two seperate arrays
    data.forEach(function(d)
    {
        dataY.push(Number(d.Gasten))
        dataX.push(d.Provincie)
    });

    // create svg object
    var svg = d3.select("body").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + ","
                          + margin.top + ")");

    // determine highest datapoint
    let maxData = Math.max(...dataY);

    // create a scale function for the x-axis
    var scaleX = d3.scale.ordinal()
                    .domain(dataX)
                    .rangeBands([0, (width - barPadding)]);

    // create a scale function for the y-axis
    var scaleY = d3.scale.linear()
                    .domain([0, maxData])
                    .range([0,height]);

    // create a second scale function for the y-axis labels
    var scaleAxisY = d3.scale.linear()
                    .domain([0, maxData])
                    .range([height, 0]);

    // add the bars to the chart
    svg.selectAll("rect")
        .data(dataY)
        .enter()
        .append("rect")
        .attr("x", function(d,i) { return i * (width / dataY.length)})
        .attr("y", function(d,i) { return height - scaleY(d); })
        .attr("width", width / dataY.length - barPadding)
        .attr("height", function(d,i) { return scaleY(d);})
        .style("fill", "pink")
        // change color when mouse is hovered over
        .on("mouseover", function()
        {
            tooltip.style("display", null);
            d3.select(this)
                .style("fill", "teal");

        })
        // change color back when mouse is not on the bar
        .on("mouseout", function()
        {
            tooltip.style("display", "none");
            d3.select(this)
                .style("fill", "pink");
        })
        // show y-value of barchart when mouse is on the bar
        .on("mousemove", function(d, i){
            var xPos = i * (width / dataY.length) + 5
            var yPos = scaleAxisY(d) - 15
            tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")");
            tooltip.select("text").text(d);
        })

    // create tooltip object
    var tooltip = svg.append("g")
                    .attr("class", tooltip)
                    .style("display", "none");

    // to show text when on display
    tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "1.2em")
            .attr("font-size", "1em");


    // create a x-axis
    var xAxis = d3.svg.axis()
        .scale(scaleX)
        .orient("bottom")
        .ticks(1);

    // create a y-axis
    var yAxis = d3.svg.axis()
                    .scale(scaleAxisY)
                    .orient("left")
                    .ticks(5);

    // draw the x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class","axis")
        .call(xAxis);

    // draw the y-axis
    svg.append("g")
        .attr("class","axis")
        .call(yAxis);

    // add an title to the chart
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(titleGraph);

    // add x-axis label
    svg.append("text")
        .attr("transform","translate(" + (width/2) + " ," +
                      (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text(xLabel);

    // add y-axis label
    svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 0 - margin.left)
     .attr("x",0 - (height / 2))
     .attr("dy", "1em")
     .style("text-anchor", "middle")
     .text(yLabel);

     // add source
     d3.select("body")
         .append("p")
         .text("Bron: " + source);
});
