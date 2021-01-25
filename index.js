var currentVaccinated = document.getElementById('current-vaccinated').getContext('2d');
var vaccinatedCumulative = document.getElementById('vaccinated-cumulative').getContext('2d');
var vaccinatedDaily = document.getElementById('vaccinated-daily').getContext('2d');

var ukPopulation = 67000000;
var query = {
    "date":"date",
    "firstDose":"cumPeopleVaccinatedFirstDoseByPublishDate",
    "secondDose":"cumPeopleVaccinatedSecondDoseByPublishDate",
    "firstDoseDaily": "newPeopleVaccinatedFirstDoseByPublishDate",
    "secondDoseDaily": "newPeopleVaccinatedSecondDoseByPublishDate"
};

$.getJSON('https://coronavirus.data.gov.uk/api/v1/data?filters=areaType=overview&structure=' + JSON.stringify(query), function(data) {
    if (data.data) {
        $('.last-updated').text(moment(data.data[0].date).format('Do MMMM'));

        var firstDoseTotal = data.data[0].firstDose;
        var secondDoseTotal = data.data[0].secondDose;
        var unvaccinatedTotal = ukPopulation - firstDoseTotal - secondDoseTotal;
        var vaccinationPieChart = new Chart(currentVaccinated, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        secondDoseTotal,
                        firstDoseTotal - secondDoseTotal,
                        unvaccinatedTotal
                    ],
                    backgroundColor: [
                        '#8bc640',
                        '#ffbd00',
                        '#cccccc'
                    ]
                }],
                labels: [
                    'Received both doses',
                    'Received 1st dose only',
                    'Unvaccinated'
                ]
            },
            options: {
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var dataset = data.datasets[tooltipItem.datasetIndex];
                            var meta = dataset._meta[Object.keys(dataset._meta)[0]];
                            var total = meta.total;
                            var currentValue = dataset.data[tooltipItem.index];
                            var percentage = parseFloat((currentValue/total*100).toFixed(1));
                            currentValue = currentValue.toString();
                            currentValue = currentValue.split(/(?=(?:...)*$)/);
                            currentValue = currentValue.join(',');
                            return currentValue + ' (' + percentage + '%)';
                        },
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index];
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        });

        var dates = [];
        var cumulativeFirstDoses = [];
        var dailyFirstDoses = [];
        var cumulativeSecondDoses = [];
        var dailySecondDoses = [];
        var maxPlotPoints = 7;

        for (i = 0; i < maxPlotPoints; i++) {
            dates.unshift(moment(data.data[i].date).format('Do MMMM'));
            cumulativeFirstDoses.unshift(data.data[i].firstDose);
            cumulativeSecondDoses.unshift(data.data[i].secondDose);
            dailyFirstDoses.unshift(data.data[i].firstDoseDaily);
            dailySecondDoses.unshift(data.data[i].secondDoseDaily);
        }

        var cumulativeChart = generateLineChart(vaccinatedCumulative, dates, cumulativeFirstDoses, cumulativeSecondDoses);
        var dailyChart = generateLineChart(vaccinatedDaily, dates, dailyFirstDoses, dailySecondDoses);

        var averageFirstDoseDay = median(dailyFirstDoses);
        $('#first-vaccinated-date').text(moment().add(unvaccinatedTotal / averageFirstDoseDay, 'days').format('Do MMMM'));

    }
});

function generateLineChart(canvas, dates, firstDoses, secondDoses) {
    var lineChartSettings = {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Received 1st dose',
                    data: firstDoses,
                    backgroundColor: '#ffbd00',
                    borderColor: '#ffbd00',
                    fill: false
                },
                {
                    label: 'Received 2nd dose',
                    data: secondDoses,
                    backgroundColor: '#8bc640',
                    borderColor: '#8bc640',
                    fill: false
                }
            ]
        },
        options: {
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        var dataset = data.datasets[tooltipItem.datasetIndex];
                        var currentValue = dataset.data[tooltipItem.index];
                        currentValue = currentValue.toString();
                        currentValue = currentValue.split(/(?=(?:...)*$)/);
                        currentValue = currentValue.join(',');
                        return currentValue;
                    },
                    title: function(tooltipItem, data) {
                        return data.labels[tooltipItem[0].index];
                    }
                }
            },
            legend: {
                position: 'bottom'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        userCallback: function(value, index, values) {
                            value = value.toString();
                            value = value.split(/(?=(?:...)*$)/);
                            value = value.join(',');
                            return value;
                        }
                    }
                }]
            }
        }
    };

    return new Chart(canvas, lineChartSettings);
}

function median(values){
    values.sort(function(a, b){
        return a - b;
    });
    var half = Math.floor(values.length / 2);

    if (values.length % 2) {

        return values[half];
    }

    return (values[half - 1] + values[half]) / 2.0;
}

function ratio (a, b) {
    return (b == 0) ? a : ratio (b, a%b);
}
