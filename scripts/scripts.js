function renderData() {
  fetch("/config.json")
    .then(function (text) {
      return text.json();
    })
    .then(function (json) {
      window.homeAssistantAccessToken = json.home_assistant_access_token;
      window.homeAssistantUrl = json.home_assistant_url;
      window.homeAssistantStates = {};

      fetch(window.homeAssistantUrl + "/api/states", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + window.homeAssistantAccessToken,
          "Content-Type": "application/json",
        },
      })
        .then(function (text) {
          return text.json();
        })
        .then(function (states) {
          addDateTime();
          addWeather(states);
          addScenes(states);
          addSwitches(states);
        });
    });
}

renderData();

setInterval(function () {
  fetch("/config.json")
    .then(function (text) {
      return text.json();
    })
    .then(function (json) {
      window.homeAssistantAccessToken = json.home_assistant_access_token;
      window.homeAssistantUrl = json.home_assistant_url;

      fetch(window.homeAssistantUrl + "/api/states", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + window.homeAssistantAccessToken,
          "Content-Type": "application/json",
        },
      })
        .then(function (text) {
          return text.json();
        })
        .then(function (states) {
          addDateTime();
          addSwitches(states);
        });
    });
}, 1000);

setInterval(function () {
  fetch("/config.json")
    .then(function (text) {
      return text.json();
    })
    .then(function (json) {
      window.homeAssistantAccessToken = json.home_assistant_access_token;
      window.homeAssistantUrl = json.home_assistant_url;

      fetch(window.homeAssistantUrl + "/api/states", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + window.homeAssistantAccessToken,
          "Content-Type": "application/json",
        },
      })
        .then(function (text) {
          return text.json();
        })
        .then(function (states) {
          addWeather(states);
        });
    });
}, 900000);

function addSwitches(states) {
  var needsUpdate = true;

  var switches = states
    .filter(function (state) {
      return (
        state.entity_id.indexOf("switch") > -1 &&
        state.attributes.friendly_name.indexOf("Frei") == -1 &&
        state.attributes.friendly_name.indexOf("USB") == -1
      );
    })
    .map(function (state) {
      var icon = state.attributes.icon;

      if (icon) {
        icon = state.attributes.icon.replace(":", "-");
      }

      return {
        name: state.attributes.friendly_name,
        id: state.entity_id,
        checked: state.state,
        icon: icon,
      };
    });

  if (window.homeAssistantStates.hasOwnProperty("switches")) {
    if (window.homeAssistantStates.switches !== JSON.stringify(switches)) {
      needsUpdate = true;
    } else {
      needsUpdate = false;
    }
  } else {
    window.homeAssistantStates.switches = JSON.stringify(switches);
  }

  if (needsUpdate) {
    window.homeAssistantStates.switches = JSON.stringify(switches);
  } else {
    return;
  }

  var switchesEl = document.querySelector("#switches");

  var templateConfig = {
    template: document.querySelector("#switch-template"),
    element: switchesEl,
    data: switches,
  };

  renderTemplate(templateConfig);

  var checkboxes = switchesEl.querySelectorAll("input");

  for (var i = 0; i < checkboxes.length; i++) {
    var checkbox = checkboxes[i];

    if (checkbox.getAttribute("data-checked") === "on") {
      checkbox.checked = true;
    }

    checkbox.addEventListener("change", function (e) {
      fetch(window.homeAssistantUrl + "/api/services/switch/toggle", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + window.homeAssistantAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id: e.currentTarget.value }),
      });
    });
  }
}

function addScenes(states) {
  var scenesEl = document.querySelector("#scenes");

  var scenes = states
    .filter(function (state) {
      return state.entity_id.indexOf("scene") > -1;
    })
    .map(function (state) {
      var icon = state.attributes.icon;

      if (icon) {
        icon = state.attributes.icon.replace(":", "-");
      }

      return {
        name: state.attributes.friendly_name,
        id: state.entity_id,
        icon: icon,
      };
    });

  var templateConfig = {
    template: document.querySelector("#scene-template"),
    element: scenesEl,
    data: scenes,
  };

  renderTemplate(templateConfig);

  var buttons = scenesEl.querySelectorAll("button");

  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];

    button.addEventListener("click", function (e) {
      fetch(window.homeAssistantUrl + "/api/services/scene/turn_on", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + window.homeAssistantAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id: e.currentTarget.value }),
      }).then(function () {
        setTimeout(function () {
          fetch(window.homeAssistantUrl + "/api/states", {
            method: "GET",
            headers: {
              Authorization: "Bearer " + window.homeAssistantAccessToken,
              "Content-Type": "application/json",
            },
          })
            .then(function (text) {
              return text.json();
            })
            .then(function (states) {
              addSwitches(states);
            });
        }, 500);
      });
    });
  }
}

function addWeather(states) {
  var weatherCurrentEl = document.querySelector("#weather-current");
  var weatherForecastEl = document.querySelector("#weather-forecast");

  var weather = states
    .filter(function (state) {
      return state.entity_id.indexOf("weather") > -1;
    })
    .map(function (state) {
      return {
        temperature: state.attributes.temperature,
        icon: state.state.replace("partlycloudy", "partly-cloudy"),
        forecast: [
          {
            temperature: state.attributes.forecast[0].temperature,
            templow: state.attributes.forecast[0].templow,
            icon: state.attributes.forecast[0].condition.replace(
              "partlycloudy",
              "partly-cloudy"
            ),
          },
          {
            temperature: state.attributes.forecast[1].temperature,
            templow: state.attributes.forecast[1].templow,
            icon: state.attributes.forecast[1].condition.replace(
              "partlycloudy",
              "partly-cloudy"
            ),
          },
          {
            temperature: state.attributes.forecast[2].temperature,
            templow: state.attributes.forecast[2].templow,
            icon: state.attributes.forecast[2].condition.replace(
              "partlycloudy",
              "partly-cloudy"
            ),
          },
        ],
      };
    });

  var templateConfigWeatherCurrent = {
    template: document.querySelector("#weather-current-template"),
    element: weatherCurrentEl,
    data: weather[0],
  };

  var templateConfigWeatherForecast = {
    template: document.querySelector("#weather-forecast-template"),
    element: weatherForecastEl,
    data: weather[0].forecast,
  };

  renderTemplate(templateConfigWeatherCurrent);
  renderTemplate(templateConfigWeatherForecast);
}

function addDateTime() {
  var dateTimeEl = document.querySelector("#datetime");

  var needsUpdate = true;

  var currentDate = new Date();

  var weekdays = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];

  var months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  var currentDateString =
    weekdays[currentDate.getDay()] +
    ", " +
    currentDate.getDate() +
    ". " +
    months[currentDate.getMonth()] +
    " " +
    currentDate.getFullYear();

  var currentTimeString = currentDate.toTimeString().slice(0, 5);

  var dateTime = {
    date: currentDateString,
    time: currentTimeString,
  };

  if (window.homeAssistantStates.hasOwnProperty("datetime")) {
    if (window.homeAssistantStates.datetime !== JSON.stringify(dateTime)) {
      needsUpdate = true;
    } else {
      needsUpdate = false;
    }
  } else {
    window.homeAssistantStates.datetime = JSON.stringify(dateTime);
  }

  if (needsUpdate) {
    window.homeAssistantStates.datetime = JSON.stringify(dateTime);
  } else {
    return;
  }

  var templateConfig = {
    template: document.querySelector("#datetime-template"),
    element: dateTimeEl,
    data: dateTime,
  };

  renderTemplate(templateConfig);
}

function renderTemplate(config) {
  var templateRaw = config.template.innerHTML.toString();

  var templateFinal = he.decode(templateRaw).replace(/[\n\r]/g, "");

  var html = ejs.render(templateFinal, { data: config.data });
  config.element.querySelector(".slot").innerHTML = html;
}
