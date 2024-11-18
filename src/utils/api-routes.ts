const baseRoute =  `${process.env.NEXT_PUBLIC_DOMAIN}/api`;

export const ADMIN_API_ROUTES = {
LOGIN:`${baseRoute}/admin/login`,
CREATE_JOB:`${baseRoute}/admin/create-job`,
JOB_DETAILS: `${baseRoute}/admin/job-details`,
DASHBOARD_SCRAPING_CHART_DATA: `${baseRoute}/admin/dashboard/scraping-chart-data`,
DASHBOARD_METRICS: `${baseRoute}/admin/dashboard/metrics`,
};

export const USER_API_ROUTES = {
    GET_ALL_TRIPS:`${baseRoute}/all-trips`,
    GET_CITY_TRIPS: `${baseRoute}/city-trips`,
    GET_TRIP_DATA: `${baseRoute}/trips`,
    CREATE_BOOKING: `${baseRoute}/booking`,
    LOGIN: `${baseRoute}/auth/login`,
    SIGNUP: `${baseRoute}/auth/signup`,
    ME: `${baseRoute}/auth/me`,
    GET_USER_BOOKINGS: `${baseRoute}/booking/get-bookings`,
    FLIGHT_SCRAPE: `${baseRoute}/flights/scrape`,
    FLIGHT_SCRAPE_STATUS: `${baseRoute}/flights/scrape-status`,
    GET_ALL_HOTELS: `${baseRoute}/all-hotels`,
    HOTELS_SCRAPE: `${baseRoute}/hotels/scrape`,
    HOTELS_SCRAPE_STATUS: `${baseRoute}/hotels/scrape-status`,
    GET_CITY_HOTELS: `${baseRoute}/home/city-hotels`,
    GET_ALL_BOOKINGS: `${baseRoute}/booking`,
    GET_UNIQUE_TRIP_CITIES: `${baseRoute}/home/unique-cities`,
};