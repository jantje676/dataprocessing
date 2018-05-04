/*
 * Kenneth Goei
 * 11850701
 */

var govExpenditure = "https://stats.oecd.org/SDMX-JSON/data/SNA_TABLE11/AUT+BEL+FRA+DEU+NLD.GOVEXP+TLYCG.050.GS13.C/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    pollution= "https://stats.oecd.org/SDMX-JSON/data/AIR_GHG/AUT+BEL+FRA+DEU+NLD.GHG.GHG_CAP/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    years = [],
    countries = [],
    dataset = [];

// wait till window has loaded
window.onload = function() {
    // wait till data has been loaded from website
    d3.queue()
        .defer(d3.request, govExpenditure)
        .defer(d3.request, pollution)
        .awaitAll(getData);
};

/*
 * Get the data from the OECD API and transform to a dict.
 */
function getData(error, response)
{
    if(error) throw error;

    // parse the string to a JSON object
    let dataExpenditure = JSON.parse(response[0].response);
    let dataPollution = JSON.parse(response[1].response);

    // get the dict within the JSON to get the countries and the years
    let countriesData = dataExpenditure.structure.dimensions.observation[0].values;
    let yearsData = dataExpenditure.structure.dimensions.observation[5].values;

    // get all the countries
    for(let i = 0 ; i < countriesData.length ; i++)
    {
        countries.push(countriesData[i].name);
    }

    // get all the years
    for(let i = 0 ; i < yearsData.length ; i++)
    {
        years.push(yearsData[i].name);
    }

    // move into the json object to the data
    dataPollution= dataPollution.dataSets[0].observations;
    dataExpenditure = dataExpenditure.dataSets[0].observations;

    // save the data in a dict
    for(let i = 0 ; i < countries.length ; i++)
    {
        for(let j = 0 ; j < years.length ; j++)
        {
            dataset.push({ "pollution" : dataPollution[i + ":0:0:" + j][0],
                        "expenditure" : dataExpenditure[i + ":0:0:0:0:" + j][0],
                        "countries" : countries[i],
                        "year" : years[(j % years.length)]});
        }
    }
    makeGraph(dataset)
};

/*
 * Update the data for the chosen year and update the graph.
 */
function change(year)
{
    let newData = [];

    // all the years are chosen
    if(year == "all")
    {
        newData = dataset;
    }

    // select the data of the chosen year
    for(let i = 0 ; i < dataset.length ; i++)
    {
        if(dataset[i]["year"] == year)
        {
            newData.push(dataset[i]);
        }
    }
    // update graph
    makeGraph(newData);
}

/*
 * Make a scatterplot using d3.
 */
function makeGraph(data)
{
    // info needed for graph
    var margin = {top: 40, right: 30, bottom: 150, left: 60},
        width = 1020 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        xLabel = "Total government expenditure for environment protection in euro",
        yLabel = "Total emmission CO in kg per capita",
        source = "OECD",
        titleGraph = "Total government expenditure for environment protection" +
                     " vs Total emmission CO in kg per capita (2011-2015)",
        name = "Kenneth Goei, 11850701"
        explanation = "Een scatterplot welke de uitgaven aan milleu bescherming weg zet tegenover de uitstoot van koolstof monoxide van verschillende Europese landen.";

    // delete old svg if needed
    d3.select("svg").remove()

    // create a new svg object
    var svg = d3.select("body").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + ","
                          + margin.top + ")");

    // get the maximum values of the data
    let max = maxData(data);

    // select a color scale
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    //create a scale function for the x-values
    var scaleX = d3.scaleLinear()
                    .domain([0, max[0]])
                    .range([0,width]);

    // create a scale function for the y-values
    var scaleY = d3.scaleLinear()
                    .domain([0, max[1]])
                    .range([0,height]);

    // create a scale function for the y-axis
    var scaleYaxis = d3.scaleLinear()
                    .domain([max[1], 0])
                    .range([0,height]);

    // place dots on the screen
    svg.selectAll("circle")
         .data(data)
         .enter()
         .append("circle")
            .attr("cx", function(d) {return scaleX(d["expenditure"]);})
            .attr("cy", function(d) {return height - scaleY(d["pollution"]);})
            .attr("r", 5)
            .attr("fill",function(d){return color(d["countries"])});

    // create a x-axis
    var xAxis = d3.axisBottom(scaleX);

    // create a y-axis
    var yAxis = d3.axisLeft(scaleYaxis);

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
             (height + margin.top) + ")")
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
     svg.append("text")
        .attr("y", height + margin.bottom)
        .attr("x",0)
        .attr("font-size", "10px")
        .text("Bron: " + source );

    // add name
    svg.append("text")
        .attr("y", height + margin.bottom/1.1)
        .attr("x",0)
        .text(name);

    // add explanation
    svg.append("text")
        .attr("y", height + margin.bottom/1.3)
        .attr("x",0)
        .text(explanation);

    // draw legend
    var legend = svg.selectAll(".legend")
                    .data(color.domain())
                .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i)
                         { return "translate(" + (-width/1.3 + i * 120) + "," +
                         (height + margin.bottom/2) + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d;})
}

/*
 * Get the maximum values of two arrays.
 */
function maxData(data)
{
    let maxPollution = 0,
        maxExpenditure = 0;

    // go over the array and search for the highest value
    for(let i = 0 ; i < data.length ; i++)
    {
        if(data[i]["pollution"] > maxPollution)
        {
            maxPollution = data[i]["pollution"];
        }
        if(data[i]["expenditure"] > maxExpenditure)
        {
            maxExpenditure = data[i]["expenditure"];
        }
    }
    return [maxExpenditure, maxPollution];
}
