let board = void 0;
let instances = void 0;
let currentInstanceId = void 0;
const pollingCheckbox = document.getElementById('enablePolling');
const KPIOptions = {
    chart: {
        height: 165,
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
        type: 'solidgauge'
    },
    yAxis: {
        min: 0,
        max: 100,
        stops: [
            [0.1, '#33A29D'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353'] // red
        ]
    },
    pane: {
        background: {
            innerRadius: '80%',
            outerRadius: '100%'
        }
    },
    accessibility: {
        typeDescription: 'The gauge chart with 1 data point.'
    }
};

Highcharts.setOptions({
    credits: {
        enabled: false
    },
    title: {
        text: ''
    }
});

pollingCheckbox.onchange = async e => {
    if (e.target.checked) {
        // charts data
        (await board.dataPool.getConnector('charts')).startPolling();
        // KPI instances data
        (await board.dataPool.getConnector('instanceDetails')).startPolling();
    } else {
        // charts data
        (await board.dataPool.getConnector('charts')).stopPolling();
        // KPI instances data
        (await board.dataPool.getConnector('instanceDetails')).stopPolling();
    }
};

const setupDashboard = instanceId => {
    const instance = instances.find(
        instance => instance.InstanceId === instanceId
    ) || instances[0];

    // for polling option
    currentInstanceId = instance.InstanceId;

    board = Dashboards.board('container', {
        dataPool: {
            connectors: [{
                id: 'charts',
                type: 'JSON',
                options: {
                    firstRowAsNames: false,
                    columnNames: [
                        'timestamp', 'readOpt', 'writeOpt', 'networkIn',
                        'networkOut', 'cpuUtilization'
                    ],
                    dataUrl: 'https://demo-live-data.highcharts.com/instance-details.json',
                    beforeParse: function (data) {
                        const currentInstance = data.find(
                            inst => inst.InstanceId === currentInstanceId
                        ) || data;
                        return currentInstance.Details.map(
                            el => el
                        );
                    }
                }
            }, {
                id: 'instanceDetails',
                type: 'JSON',
                options: {
                    firstRowAsNames: false,
                    orientantion: 'columns',
                    columnNames: [
                        'index', 'CPUUtilization', 'MemoryUsage', 'DiskSizeGB',
                        'DiskUsedGB', 'DiskFreeGB', 'MediaGB', 'RootGB',
                        'Documents', 'Downloads'
                    ],
                    dataUrl: 'https://demo-live-data.highcharts.com/instances.json',
                    beforeParse: function (data) {
                        const currentInstance = data.find(
                            inst => inst.InstanceId === currentInstanceId
                        ) || data;
                        const diskSpace = currentInstance.DiskSpace.RootDisk;
                        return [
                            [
                                0, // display one record on chart KPI / disk
                                currentInstance.CPUUtilization,
                                currentInstance.MemoryUsage,
                                diskSpace.SizeGB,
                                diskSpace.UsedGB,
                                diskSpace.FreeGB,
                                diskSpace.MediaGB,
                                diskSpace.RootGB,
                                diskSpace.Documents,
                                diskSpace.Downloads
                            ]
                        ];
                    }
                }
            }, {
                id: 'instances',
                type: 'JSON',
                options: {
                    firstRowAsNames: false,
                    data: instances
                }
            }]
        },
        gui: {
            layouts: [{
                rows: [{
                    id: 'instance-details',
                    cells: [{
                        id: 'instance'
                    }, {
                        id: 'zone'
                    }, {
                        id: 'ami'
                    }, {
                        id: 'os'
                    }]
                }, {
                    cells: [{
                        id: 'instances-table'
                    }, {
                        id: 'kpi-wrapper',
                        layout: {
                            rows: [{
                                cells: [{
                                    id: 'cpu'
                                }, {
                                    id: 'memory'
                                }]
                            }, {
                                cells: [{
                                    id: 'health'
                                }, {
                                    id: 'disk'
                                }]
                            }]
                        }
                    }]
                }, {
                    cells: [{
                        id: 'disk-usage'
                    }, {
                        id: 'cpu-utilization'
                    }]
                }, {
                    cells: [{
                        id: 'network-opt'
                    }, {
                        id: 'disk-opt'
                    }]
                }]
            }]
        },
        components: [{
            cell: 'instance',
            type: 'HTML',
            title: 'Instance type:',
            elements: [{
                tagName: 'span'
            }, {
                tagName: 'p',
                textContent: instance.InstanceType
            }]
        }, {
            cell: 'zone',
            type: 'HTML',
            title: 'Zone:',
            elements: [{
                tagName: 'span'
            }, {
                tagName: 'p',
                textContent: instance.Zone
            }]
        }, {
            cell: 'ami',
            type: 'HTML',
            title: 'AMI:',
            elements: [{
                tagName: 'span'
            }, {
                tagName: 'p',
                textContent: instance.AMI
            }]
        }, {
            cell: 'os',
            type: 'HTML',
            title: 'OS:',
            elements: [{
                tagName: 'span'
            }, {
                tagName: 'p',
                textContent: instance.OS
            }]
        }, {
            cell: 'disk-usage',
            title: 'Disk usage',
            type: 'Highcharts',
            connector: {
                id: 'instanceDetails',
                columnAssignment: [{
                    seriesId: 'media-gb',
                    data: ['x', 'MediaGB']
                }, {
                    seriesId: 'root-gb',
                    data: ['x', 'RootGB']
                }, {
                    seriesId: 'documents',
                    data: ['x', 'Documents']
                }, {
                    seriesId: 'downloads',
                    data: ['x', 'Downloads']
                }]
            },
            chartOptions: {
                xAxis: {
                    min: -0.5,
                    max: 3.5,
                    showFirstLabel: false,
                    showLastLabel: false,
                    type: 'category',
                    categories: ['MediaGB', 'RootGB', 'Documents', 'Downloads'],
                    accessibility: {
                        description: 'Disk categories'
                    }
                },
                series: [{
                    name: 'MediaGB',
                    id: 'media-gb',
                    pointStart: 0,
                    pointPlacement: -0.3
                }, {
                    name: 'RootGB',
                    id: 'root-gb',
                    pointStart: 1,
                    pointPlacement: -0.1
                }, {
                    name: 'Documents',
                    id: 'documents',
                    pointStart: 2,
                    pointPlacement: 0.1
                }, {
                    name: 'Downloads',
                    id: 'downloads',
                    pointStart: 3,
                    pointPlacement: 0.4
                }],
                yAxis: {
                    title: {
                        text: 'GB'
                    },
                    accessibility: {
                        description: 'Gigabytes'
                    }
                },
                legend: {
                    enabled: false
                },
                chart: {
                    type: 'bar'
                },
                tooltip: {
                    headerFormat: '',
                    valueSuffix: ' Gb'
                },
                plotOptions: {
                    series: {
                        relativeXValue: true,
                        pointRange: 1,
                        pointPadding: 0,
                        groupPadding: 0,
                        pointWidth: 40,
                        dataLabels: {
                            enabled: true,
                            format: '{y} GB'
                        }
                    }
                },
                lang: {
                    accessibility: {
                        chartContainerLabel: 'Disk usage. Highcharts ' +
                            'interactive chart.'
                    }
                },
                accessibility: {
                    description: 'The chart is displaying space on disk'
                }
            }
        },
        {
            cell: 'cpu-utilization',
            title: 'CPU utilization',
            type: 'Highcharts',
            connector: {
                id: 'charts',
                columnAssignment: [{
                    seriesId: 'cpu-utilization',
                    data: ['timestamp', 'cpuUtilization']
                }]
            },
            sync: {
                highlight: true
            },
            chartOptions: {
                chart: {
                    type: 'spline'
                },
                series: [{
                    name: 'CPU utilization',
                    id: 'cpu-utilization'
                }],
                xAxis: {
                    type: 'datetime',
                    accessibility: {
                        description: 'Days'
                    }
                },
                yAxis: {
                    min: 0,
                    max: 100,
                    title: {
                        text: 'Percents'
                    },
                    accessibility: {
                        description: 'Percents'
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    valueSuffix: '%'
                },
                accessibility: {
                    description: 'The chart is displaying CPU usage',
                    point: {
                        valueDescriptionFormat: 'percents'
                    }
                }
            }
        },
        {
            cell: 'cpu',
            type: 'KPI',
            connector: {
                id: 'instanceDetails'
            },
            columnName: 'CPUUtilization',
            chartOptions: {
                ...KPIOptions,
                plotOptions: {
                    series: {
                        className: 'highcharts-live-kpi',
                        dataLabels: {
                            format: '<div style="text-align:center; ' +
                                'margin-top: -20px">' +
                            '<div style="font-size:1.2em;">{y}%</div>' +
                            '<div style="font-size:14px; opacity:0.4; ' +
                            'text-align: center;">CPU</div>' +
                            '</div>',
                            useHTML: true
                        }
                    }
                },
                series: [{
                    name: 'CPU utilization',
                    innerRadius: '80%',
                    data: [{
                        colorIndex: '100'
                    }],
                    radius: '100%'
                }],
                xAxis: {
                    accessibility: {
                        description: 'Days'
                    }
                },
                lang: {
                    accessibility: {
                        chartContainerLabel: 'CPU usage. Highcharts ' +
                            'interactive chart.'
                    }
                },
                tooltip: {
                    valueSuffix: '%'
                }
            }
        }, {
            cell: 'memory',
            type: 'KPI',
            connector: {
                id: 'instanceDetails'
            },
            columnName: 'MemoryUsage',
            chartOptions: {
                ...KPIOptions,
                yAxis: {
                    min: 0,
                    max: 2048,
                    stops: [
                        [0.1, '#33A29D'], // green
                        [0.5, '#DDDF0D'], // yellow
                        [0.9, '#DF5353'] // red
                    ]
                },
                plotOptions: {
                    series: {
                        className: 'highcharts-live-kpi',
                        dataLabels: {
                            format: '<div style="text-align:center; ' +
                                'margin-top: -20px">' +
                            '<div style="font-size:1.2em;">{y} MB</div>' +
                            '<div style="font-size:14px; opacity:0.4; ' +
                            'text-align: center;">Memory</div>' +
                            '</div>',
                            useHTML: true
                        }
                    }
                },
                series: [{
                    name: 'Memory usage',
                    innerRadius: '80%',
                    data: [{
                        colorIndex: '100'
                    }],
                    radius: '100%'
                }],
                lang: {
                    accessibility: {
                        chartContainerLabel: 'Memory usage. Highcharts ' +
                            'interactive chart.'
                    }
                },
                tooltip: {
                    valueSuffix: ' MB'
                }
            }
        },
        {
            cell: 'health',
            type: 'HTML',
            class: 'health-indicator',
            elements: [{
                tagName: 'div',
                class: 'health-wrapper highcharts-' + instance.HealthIndicator +
                    '-icon',
                attributes: {
                    'aria-label': 'Health: ' + instance.HealthIndicator,
                    role: 'img'
                }
            }, {
                tagName: 'div',
                class: 'health-title',
                textContent: 'Health'
            }]
        },
        {
            cell: 'disk',
            type: 'KPI',
            connector: {
                id: 'instanceDetails'
            },
            columnName: 'DiskUsedGB',
            chartOptions: {
                ...KPIOptions,
                plotOptions: {
                    series: {
                        dataLabels: {
                            format: '<div style="text-align:center; ' +
                                'margin-top: -20px">' +
                            '<div style="font-size:1.2em;">{y} GB</div>' +
                            '<div style="font-size:14px; opacity:0.4; ' +
                            'text-align: center;">Disk space</div>' +
                            '</div>',
                            useHTML: true
                        }
                    }
                },
                series: [{
                    name: 'Disk usage',
                    innerRadius: '80%',
                    data: [{
                        colorIndex: '100'
                    }],
                    radius: '100%'
                }],
                tooltip: {
                    valueSuffix: ' Gb'
                },
                lang: {
                    accessibility: {
                        chartContainerLabel: 'Disk usage. Highcharts ' +
                            'interactive chart.'
                    }
                }
            }
        },
        {
            cell: 'network-opt',
            type: 'Highcharts',
            title: 'Network (bytes)',
            connector: {
                id: 'charts',
                columnAssignment: [{
                    seriesId: 'in',
                    data: ['timestamp', 'networkIn']
                }, {
                    seriesId: 'out',
                    data: ['timestamp', 'networkOut']
                }]
            },
            sync: {
                highlight: true
            },
            chartOptions: {
                chart: {
                    type: 'spline'
                },
                xAxis: {
                    type: 'datetime',
                    accessibility: {
                        description: 'Days'
                    }
                },
                yAxis: {
                    title: {
                        text: 'Bytes'
                    },
                    accessibility: {
                        description: 'Bytes'
                    }
                },
                legend: {
                    labelFormatter: function () {
                        const result =
                            this.name.replace(/([A-Z])/g, ' $1').toLowerCase();
                        return result.charAt(0).toUpperCase() + result.slice(1);
                    }
                },
                tooltip: {
                    valueDecimals: 0,
                    valueSuffix: ' bytes'
                },
                accessibility: {
                    description: `The chart is displaying amount of in and out
                                network operations`,
                    point: {
                        valueDescriptionFormat: 'bytes'
                    }
                },
                series: [{
                    name: 'network in',
                    id: 'in'
                }, {
                    name: 'network out',
                    id: 'out'
                }]
            }
        },
        {
            cell: 'disk-opt',
            type: 'Highcharts',
            title: 'Disk operations',
            connector: {
                id: 'charts',
                columnAssignment: [{
                    seriesId: 'read',
                    data: ['timestamp', 'readOpt']
                }, {
                    seriesId: 'write',
                    data: ['timestamp', 'writeOpt']
                }]
            },
            sync: {
                highlight: true
            },
            chartOptions: {
                chart: {
                    type: 'column'
                },
                xAxis: {
                    type: 'datetime',
                    accessibility: {
                        description: 'Days'
                    }
                },
                tooltip: {
                    valueDecimals: 0,
                    valueSuffix: ' operations'
                },
                yAxis: {
                    title: {
                        text: 'Operations'
                    },
                    accessibility: {
                        description: 'Operations'
                    }
                },
                legend: {
                    labelFormatter: function () {
                        const result =
                            this.name.replace(/([A-Z])/g, ' $1').toLowerCase();
                        return result.charAt(0).toUpperCase() + result.slice(1);
                    }
                },
                accessibility: {
                    description: `The chart is displaying amount of in and out
                                operations on disk`,
                    point: {
                        valueDescriptionFormat: 'operations'
                    }
                }
            }
        },
        {
            cell: 'instances-table',
            type: 'DataGrid',
            title: 'Instances',
            visibleColumns: [
                'InstanceId', 'InstanceType', 'PublicIpAddress', 'State',
                'HealthIndicator'
            ],
            dataGridOptions: {
                editable: false,
                columns: {
                    InstanceId: {
                        headerFormat: 'ID'
                    },
                    InstanceType: {
                        headerFormat: 'Type'
                    },
                    PublicIpAddress: {
                        headerFormat: 'Public IP'
                    },
                    HealthIndicator: {
                        headerFormat: 'Health'
                    }

                },
                events: {
                    row: {
                        click: async function (e) {
                            const enabledPolling = pollingCheckbox.checked;
                            if (enabledPolling) {
                                // stop polling when is enabled
                                await pollingCheckbox.click();
                            }
                            board.destroy();
                            setupDashboard(
                                e.target.parentNode.childNodes[0].innerText
                            );

                            // run polling when was enabled
                            if (enabledPolling) {
                                await pollingCheckbox.click();
                            }
                        }
                    }
                }
            },
            connector: {
                id: 'instances'
            },
            events: {
                mount: function () {
                    setTimeout(() => {
                        const currentRow =
                            document.querySelector(
                                `[data-original-data="${instance.InstanceId}"]`
                            ).parentNode;
                        currentRow.classList.add('current');
                    }, 1);
                }
            }
        }]
    });
};

// Init
(async () => {
    // load init list of intances
    instances = await fetch(
        'https://demo-live-data.highcharts.com/instances.json'
    ).then(response => response.json());

    setupDashboard();
    // run polling
    await pollingCheckbox.click();
})();

//___________________HOME 2D__________________________
document.addEventListener("DOMContentLoaded", function() {
  const powerElement = document.getElementById('powerBox');
  powerElement.addEventListener('click', function() {
      showPopUp();
  });
});

function showPopUp() {
  document.getElementById('popUpContainer').style.display = 'flex';
}

function closePopUp() {
  document.getElementById('popUpContainer').style.display = 'none';
}

function calculateTotal() {
  const price = document.getElementById('pricePerKw').value;

  const totals = [
      { id: 'total1', kw: 20, days: 5 },
      { id: 'total2', kw: 30, days: 5 },
      { id: 'total3', kw: 40, days: 5 },
      { id: 'total4', kw: 30, days: 4 },
      { id: 'total5', kw: 30, days: 4 }
  ];

  totals.forEach(total => {
      const amount = total.kw * total.days * price;
      document.getElementById(total.id).textContent = amount ? amount.toFixed(2) + ' VND' : '--';
  });
}

function refreshTotal() {
  const totals = [
      'total1', 'total2', 'total3', 'total4', 'total5'
  ];

  totals.forEach(id => {
      document.getElementById(id).textContent = '--'; // Làm mới các giá trị tiền tệ
  });

  document.getElementById('pricePerKw').value = ''; // Làm mới trường nhập liệu giá tiền
}

function loadHouse(houseId) {
  // Hide the menu
  document.getElementById('menu').classList.remove('active');

  // Clear the background and overlay
  document.querySelector('.background-container').style.display = 'none';
  document.querySelector('.overlay').style.display = 'none';

    // Show the back and light buttons when a house is selected
  document.querySelector('.back-button-container').style.display = 'block';
  document.querySelector('.light-button-container').style.display = 'block';

  // Show the selected house view
  document.getElementById(houseId).classList.add('active');

  // Start updating values for house 1
  if (houseId === 'house1') {
      updateValues();
      setInterval(updateValues, 2000); // Update every 2 seconds
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const humidElement = document.getElementById('humidBox');
  humidElement.addEventListener('click', function() {
      showWeatherPopUp();
  });
});

function showWeatherPopUp() {
// Giả lập giá trị thời tiết hoặc sử dụng OpenWeatherMap API
document.getElementById('weatherTemp').textContent = "23°C"; // Nhiệt độ thực tế
document.getElementById('weatherHumidity').textContent = "88%"; // Độ ẩm thực tế
document.getElementById('weatherWind').textContent = "4.06 m/s"; // Tốc độ gió thực tế
document.getElementById('weatherDesc').textContent = "Light Rain"; // Mô tả thời tiết thực tế

document.getElementById('weatherPopUpContainer').style.display = 'flex';
}


function closeWeatherPopUp() {
  document.getElementById('weatherPopUpContainer').style.display = 'none';
}

// Hàm giả lập giá trị ngẫu nhiên
function getRandomValue(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function goBackToMenu() {
  // Hide all house views
  document.querySelectorAll('.house-container').forEach(function(el) {
      el.classList.remove('active');
  });

  // Restore the background and overlay
  document.querySelector('.background-container').style.display = 'block';
  document.querySelector('.overlay').style.display = 'block';

  // Show the menu
  document.getElementById('menu').classList.add('active');
}

//_________________________Function : Toggle Light ____________________
let lightOn = true; // Biến để theo dõi trạng thái của đèn
function toggleLight() {
  lightOn = !lightOn; // Đảo ngược trạng thái đèn
  const houseContainer = document.getElementById('house1');
  const lightButton = document.getElementById('lightButton');
  if (lightOn) {
      houseContainer.style.filter = 'brightness(1)'; // Đặt lại độ sáng bình thường
      lightButton.textContent = 'Turn Off Light';
      lightButton.classList.remove('off');
      lightButton.classList.add('on');
      lightButton.style.backgroundColor = '#32cd32'; // Đổi màu nút sang màu sáng khi đèn bật

  } else {
      houseContainer.style.filter = 'brightness(0.15)'; // Giảm độ sáng trang
      lightButton.textContent = 'Turn On Light';
      lightButton.classList.remove('on');
      lightButton.classList.add('off');
      lightButton.style.backgroundColor = '#555'; // Đổi màu nút sang màu tối khi đèn tắt
  }

}

function getRandomValue(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function updateValues() {
  document.getElementById('temperature').textContent = getRandomValue(18, 30); // Temperature between 18°C and 30°C
  document.getElementById('humidity').textContent = getRandomValue(30, 70); // Humidity between 30% and 70%
  document.getElementById('power').textContent = getRandomValue(100, 500); // Power consumption between 100W and 500W
}

//___________________________ERA CONFIG_______________________________________
const eraWidget = new EraWidget();
let config = { id: 52438 };
eraWidget.onConfiguration((configuration) => {
  config = configuration.realtime_configs.find(cfg => cfg.id === 52438);
  console.log("Received configuration:", config);
});

eraWidget.onValues((values) => {
  console.log("Received values onValues function:", values);
  if (values[config.id]) {
      const value = values[config.id].value;
      if (value !== (lightOn ? 1 : 0)) {
          toggleLight(); // Toggle the light if the value changes
      }
  }
});
eraWidget.ready();
