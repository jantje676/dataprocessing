/*
 * Kenneth Goei
 * 11850701
 *
 * Script to create two visualisations (map and scatter),
 * which are linked to each other.
 */

// to save the data
var energyIntensity = "https://stats.oecd.org/SDMX-JSON/data/GREEN_GROWTH/AUT+BEL+FRA+DEU+DNK+ESP+ITA+NLD+PRT.NRG_INT/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    govExpenditure = "https://stats.oecd.org/SDMX-JSON/data/SNA_TABLE11/AUT+BEL+FRA+DEU+DNK+ESP+ITA+NLD+PRT.GOVEXP+TLYCG.050.GS13.C/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    pollution= "https://stats.oecd.org/SDMX-JSON/data/AIR_GHG/AUT+BEL+FRA+DEU+DNK+ESP+ITA+NLD+PRT.GHG.GHG_CAP/all?startTime=2011&endTime=2015&dimensionAtObservation=allDimensions",
    years = [],
    countries = [],
    datasetScatter = [],
    dataset = []
    yearSet = "all";

// wait till window has loaded
window.onload = function()
{
    // wait till data has been loaded from website
    queue()
        .defer(d3.request, energyIntensity)
        .defer(d3.request, govExpenditure)
        .defer(d3.request, pollution)
        .awaitAll(getData);
};

/*
 * Get the data from the OECD through the API
 */
function getData(error, response)
{
    if(error) throw error;

    // parse the string to a JSON object
    let dataEnergyIntensity = JSON.parse(response[0].response);
    let dataExpenditure = JSON.parse(response[1].response);
    let dataPollution = JSON.parse(response[2].response);

    // get the dict within the JSON to get the countries and the years
    let countriesData = dataEnergyIntensity.structure.dimensions.observation[0].values;
    let yearsData = dataEnergyIntensity.structure.dimensions.observation[2].values;

    // get all the countries
    for(let i = 0 ; i < countriesData.length ; i++)
    {
        countries.push(countriesData[i].id);
    }

    // get all the years
    for(let i = 0 ; i < yearsData.length ; i++)
    {
        years.push(yearsData[i].name);
    }

    // move into the json object to the data
    dataEnergyIntensity= dataEnergyIntensity.dataSets[0].observations;
    dataPollution= dataPollution.dataSets[0].observations;
    dataExpenditure = dataExpenditure.dataSets[0].observations;

    // save the data in a dict
    for(let i = 0 ; i < countries.length ; i++)
    {
        for(let j = 0 ; j < years.length ; j++)
        {
            dataset.push({ "energy" : dataEnergyIntensity[i + ":0:" + j][0],
                        "countries" : countries[i],
                        "pollution" : dataPollution[i + ":0:0:" + j][0],
                        "expenditure" : dataExpenditure[i + ":0:0:0:0:" + j][0],
                        "year" : years[j]});
        }
    }

    // display the data from the chosen year on the map, 2015 is basic
    updateYear(2015);

    // create scatterplot
    makeScatter(dataset, "expenditure", "pollution")
}

/*
 * Select the data from the chosen year for the map
 */
function updateYear(year)
{
    let newData = [];
    yearSet = year;

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

    let newDatasetMap = {};
    let minAndMax = [];

    // select the right data and keep track of all the values for later
    for(let i = 0 ; i < dataset.length ; i++)
    {
        if(dataset[i]["year"] == year)
        {
            newDatasetMap[dataset[i]["countries"]] ={"energy" :  dataset[i]["energy"],
                                                  "fillColor" : 0};

            minAndMax.push(dataset[i]["energy"]);
        }
    }

    // update map
    makeMap(newDatasetMap, minAndMax);

    // update graph
    makeScatter(newData, "expenditure", "pollution");
}

/*
 * Update the data by only selecting the data of one country,
 * when hovering over the map
 */
function updateCountry(country)
{
    let newData = [];

    // select only the data of the chosen country
    for(let i = 0 ; i < countries.length ; i++)
    {
        if(country == countries[i])
        {
            // select the data of the chosen country
            for(let i = 0 ; i < dataset.length ; i++)
            {
                if(dataset[i]["countries"] == country)
                {
                    newData.push(dataset[i]);
                }
            }
            // update scatter with data from chosen country
            makeScatter(newData, "expenditure", "pollution");
        }
    }
}

/*
 * Create a datamap
 */
function makeMap(newDatasetMap, minAndMax)
{
    // delete old svg if needed
    d3.select("svg").remove()

    // get the min and max value for the color scale
    let minValue = Math.min(...minAndMax);
    let maxValue = Math.max(...minAndMax);

    // create a color scale for the countries
    let colorScale = d3.scale.linear()
            .domain([minValue,maxValue])
            .range(["#EFEFFF","#02386F"]); // blue color

    // update the color according to the scale for every country
    for(let country in newDatasetMap)
    {
        newDatasetMap[country]["fillColor"] = colorScale(newDatasetMap[country]["energy"]);
    }

    // create a map
    let map = new Datamap({ element: document.getElementById("map"),
        // zoom in on Europe
        setProjection: function(element, options)
        {
            let projection = d3.geo.mercator()
                   .center([40, 40])
                   .scale(500);

              let path = d3.geo.path()
                .projection(projection);

            return {path: path, projection: projection};
        },
        // link the dataset to the map
        data: newDatasetMap,
        geographyConfig:
        {
            // show energy intensity when hovered over and update scatter
            popupTemplate: function(geo, data)
            {
                updateCountry(geo.id);
                return ['<div class="hoverinfo"><strong>',
                        'Energy Intensity ' + geo.properties.name,
                        ': ' + data.energy,
                        '</strong></div>'].join('');
            }
        }
    });
}

/*
 * Make a scatterplot using d3.
 */
function makeScatter(data, xValue, yValue)
{
    // info needed for graph
    let margin = {top: 100, right: 100, bottom: 150, left: 60},
        width = 1100 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        yLabel = "Total emmission CO in kg per capita";

    // delete old svg if needed
    d3.select("#scatter").remove()

    // create a new svg object
    let svg = d3.select("body").append("svg")
                    .attr("id", "scatter")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .on("click", function()
                    {
                        updateYear(yearSet);
                    })
                .append("g")
                    .attr("transform", "translate(" + margin.left + ","
                          + margin.top + ")");

    // get the maximum values of the data
    let max = maxData(data, yValue, xValue);

    // select a color scale
    let color = d3.scale.category10();

    //create a scale function for the x-values
    let scaleX = d3.scale.linear()
                    .domain([0, max[0]])
                    .range([0,width]);

    // create a scale function for the y-values
    let scaleY = d3.scale.linear()
                    .domain([0, max[1]])
                    .range([0,height]);

    // create a scale function for the y-axis
    let scaleYaxis = d3.scale.linear()
                    .domain([max[1], 0])
                    .range([0,height]);

    // place dots on the screen
    svg.selectAll("circle")
         .data(data)
         .enter()
         .append("circle")
            .attr("cx", function(d) {return scaleX(d[xValue]);})
            .attr("cy", function(d) {return height - scaleY(d[yValue]);})
            .attr("r", 5)
            .attr("fill",function(d){return color(d["countries"])})
            .on("mousemove", function(d, i)
            {
                let xPos = 0;
                let yPos = -30;
                tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")");
                tooltip.style("display", "block");
                tooltip.select("text").text("country: " + d["countries"] + " " +xValue + " : " + d[xValue] + " " + yValue + ": " + d[yValue] + " year: " + d["year"] );
            })
            // change color back when mouse is not on the bar
            .on("mouseout", function()
            {
                tooltip.style("display", "none");
            });

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
    let xAxis = d3.svg.axis()
        .scale(scaleX)
        .orient("bottom")
        .ticks(8);

    // create a y-axis
    let yAxis = d3.svg.axis()
                    .scale(scaleYaxis)
                    .orient("left")
                    .ticks(10);

    // draw the x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class","axis")
        .call(xAxis);

    // draw the y-axis
    svg.append("g")
        .attr("class","axis")
        .call(yAxis);

    // add x-axis label
    svg.append("text")
        .attr("transform","translate(" + (width/2) + " ," +
             (height + margin.top / 2) + ")")
        .style("text-anchor", "middle")
        .text(function()
        {
            if(xValue === "expenditure")
            {
                return "Total government expenditure for environment protection in euro";
            }
            else
            {
                return "Energy intensity in GDP per kg oil per capita";
            }
        });

    // add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yLabel);

    // add an title to the chart
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .style("text-anchor", "middle")
        .style("font-size", "21px")
        .text(function()
            {
                if(xValue === "expenditure")
                {
                    return "Total government expenditure for environment" +
                    "protection vs Total emmission CO in kg per capita (2011-2015)";
                }
                else
                {
                    return "Energy intensity in GDP per kg oil vs Total emmission" +
                           "CO in kg per capita (2011-2015)";
                }
            });


    // draw legend
    let legend = svg.selectAll(".legend")
                    .data(color.domain())
                .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i)
                         { return "translate(" + (-width/1.1 + i * 100) + "," +
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
 * Help function to change the scatter using the bootstrap button
 */
function changeScatter(xValue)
{
    makeScatter(dataset, xValue, "pollution");
}


/*
 * Get the maximum values of two arrays.
 */
function maxData(data, value1, value2)
{
    let max1 = 0,
        max2 = 0;

    // go over the array and search for the highest value
    for(let i = 0 ; i < data.length ; i++)
    {
        if(data[i][value1] > max1)
        {
            max1 = data[i][value1];
        }
        if(data[i][value2] > max2)
        {
            max2 = data[i][value2];
        }
    }
    return [max2, max1];
}
