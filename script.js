const nextSalahEl = document.getElementById('next-salah');
const afterSalahEl = document.getElementById('after-salah');
const tomorrowListEl = document.getElementById('tomorrow-list');

const latitude = 28.6139;
const longitude = 77.2090;
const timezone = 'Asia/Kolkata';

let todayTimes = [];
let tomorrowTimes = [];

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function convertTo12Hour(timeStr) {
  let [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

async function fetchPrayerTimes(dateType = 'today') {
  const now = new Date();
  const targetDate = new Date(now);

  if (dateType === 'tomorrow') {
    targetDate.setDate(now.getDate() + 1);
  }

  const day = targetDate.getDate().toString().padStart(2, '0');
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const year = targetDate.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;
  const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}&method=1&timezonestring=${timezone}&school=1`;

  console.log(`Fetching: ${dateType} -> ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 200) {
      console.error("API error:", data);
      return;
    }

    const timings = data.data.timings;
    const salahTimes = [
      { name: 'Fajr', time: timings.Fajr },
      { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha }
    ];

    if (dateType === 'today') {
      todayTimes = salahTimes;
    } else {
      tomorrowTimes = salahTimes;
    }

    updateSalahTimes();

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function updateSalahTimes() {
  const nowMins = getCurrentMinutes();
  let next = null;
  let after = null;
  let upcoming = [];

  for (let i = 0; i < todayTimes.length; i++) {
    const salah = todayTimes[i];
    const salahMins = timeToMinutes(salah.time);

    if (nowMins < salahMins) {
      next = salah;
      after = todayTimes[i + 1] || tomorrowTimes[0];
      upcoming = [...todayTimes.slice(i + 2), ...tomorrowTimes];
      break;
    }
  }

  if (!next) {
    next = tomorrowTimes[0];
    after = tomorrowTimes[1] || tomorrowTimes[0];
    upcoming = tomorrowTimes.slice(2);
  }

  nextSalahEl.textContent = `${next.name} - ${convertTo12Hour(next.time)}`;
  afterSalahEl.textContent = `After that: ${after.name} - ${convertTo12Hour(after.time)}`;

  tomorrowListEl.innerHTML = '';
  upcoming.forEach(salah => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${salah.name}</span> <span>${convertTo12Hour(salah.time)}</span>`;
    tomorrowListEl.appendChild(li);
  });

  console.log(`Next Salah: ${next.name} at ${next.time}`);
  console.log(`After Salah: ${after.name} at ${after.time}`);
}

(async function initApp() {
  await fetchPrayerTimes('today');
  await fetchPrayerTimes('tomorrow');

  setInterval(updateSalahTimes, 60000); // Update every minute
})();
