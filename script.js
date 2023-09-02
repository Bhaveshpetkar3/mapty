'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
  _setDescription() {
    // prettier-ignore
    //console.log(this);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run1=new Running([39,-12],5.2,24,178);
// const cycling1=new Cycling([39,-12],27,95,523);
// console.log(run1,cycling1);

////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition(); //get the posi. as soon as the app loads.
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get the location for some reason!');
        }
      );
    }
  }

  _loadMap(position) {
    const latitude = position.coords.latitude; //getting the latitude and longitude stored
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 15); //the 'map' here must be the id name of the html element that we want to display the map in.

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this)); //This is a method coming from leaflet library.
  }

  _showForm(mapE) {
    form.style.display = 'grid';
    this.#mapEvent = mapE;
    form.classList.remove('hidden'); //to remove the hidden class from the form element.
    inputDistance.focus(); //shift the focus on the distance field of the form.
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden'); //Choosing the closest 'form__row' parent and then toggling the hidden class.
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault(); //to prevent the default behavior of forms to reload on submit.
    const validinputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //  Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; //used the + to convert string to number
    const duration = +inputDuration.value;
    const markercoords = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
    let workout;

    //  If activity is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //  Check if data is valic
      if (
        !validinputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running(markercoords, distance, duration, cadence);
      //this.#workouts.push(workout);
      //console.log(workout);
    }

    //  If activity is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validinputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling(markercoords, distance, duration, elevation);
    }

    //  Add new object to workout array
    this.#workouts.push(workout);
    //console.log(this.#workouts);

    //  Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //  Render workout on list slider component
    this._renderWorkout(workout);

    //  Clear input field +Hide the form
    this._hideForm();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords) //to put the marker on the map.
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, //we are doing this to ensure that when multiple markers are created, their pop-ups also stay and not autoclose. We got this method from the leaflet docs. https://leafletjs.com/reference.html#marker
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      ) //to set the text to be displayed in the popup.
      .openPopup();
  }
  _renderWorkout(workout) {
    //console.log(workout);
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === 'running')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div></li>`;
    if (workout.type === 'cycling')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    form.insertAdjacentHTML('afterend', html);
  }
}
const app = new App();
