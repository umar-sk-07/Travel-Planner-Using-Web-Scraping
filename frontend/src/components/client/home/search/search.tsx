"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input, Listbox, ListboxItem } from "@nextui-org/react";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";

const Home = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const [searchLocation, setSearchLocation] = useState("");
  const [dates, setDates] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [cities, setCities] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const parallaxElements = document.querySelectorAll<HTMLElement>(".parallax");
    const main = mainRef.current;
    const bgImg = document.querySelector<HTMLImageElement>(".bg-img");

    function handleMouseMove(e: MouseEvent) {
      const xValue = e.clientX - window.innerWidth / 2;
      const yValue = e.clientY - window.innerHeight / 2;

      parallaxElements.forEach((el) => {
        const speedX = el.dataset.speedx ? parseFloat(el.dataset.speedx) : 0;
        const speedY = el.dataset.speedy ? parseFloat(el.dataset.speedy) : 0;

        if (el.classList.contains("bg-img")) {
          el.style.transform = `translate(-50%, -50%) scale(1.5) translate(${-xValue * speedX}px, ${yValue * speedY}px)`;
        } else {
          el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) translateY(calc(-50% + ${yValue * speedY}px))`;
        }
      });
    }

    function handleResize() {
      if (main) {
        main.style.height = `${window.innerHeight}px`;
      }
      if (bgImg) {
        const scale = Math.max(window.innerWidth / bgImg.naturalWidth, window.innerHeight / bgImg.naturalHeight) * 1.5;
        bgImg.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }
    }

    if (main) {
      main.style.height = `${window.innerHeight}px`;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSearch = () => {
    if (searchLocation && dates) {
      router.push(`/trips?city=${searchLocation}&dates=${dates}`);
    }
  };

  const searchCities = async (searchQuery: string) => {
    const response = await fetch(
      `https://secure.geonames.org/searchJSON?q=${searchQuery}&maxRows=5&username=kishan&style=SHORT`
    );
    const parsed = await response.json();
    setCities(
      parsed?.geonames.map((city: { name: string }) => city.name) ?? []
    );
  };

  const activities = [
    { name: "Sea & Sailing", icon: "/home/ship.svg" },
    { name: "Trekking Tours", icon: "/home/hiking.svg" },
    { name: "City Tours", icon: "/home/trolley-bag.svg" },
    { name: "Motor Sports", icon: "/home/motor-boat.svg" },
    { name: "Jungle Safari", icon: "/home/cedar.svg" },
  ];

  return (
    <div>
      <main ref={mainRef} className="relative h-screen w-full overflow-hidden">
        <div className="vignette absolute z-[100] w-full h-full top-0 bg-radial-gradient pointer-events-none"></div>

        {/* Parallax Background and Foreground Elements */}
        <img
          src="/Landing/images/background.png"
          className="parallax bg-img scale-x-150 scale-y-150 absolute w-[194.44%] top-[1.86%] left-[50.69%] -translate-x-1/2 -translate-y-1/2 z-[1] pointer-events-none object-cover"
          data-speedx="0.1"
          data-speedy="0.2"
          alt="Background"
        />
        <img
          src="/Landing/images/fog_7.png"
          className="parallax fog-7 absolute z-[2] w-[132%] top-[37.7%] left-[70.8%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.27"
          data-speedy="0.32"
          alt="Fog 7"
        />
        <img
          src="/Landing/images/mountain_10.png"
          className="parallax mountain-10 absolute z-[3] w-[61.94%] top-[58.52%] left-[65.97%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.195"
          data-speedy="0.305"
          data-speedz="0"
          data-rotation="0"
          data-distance="1100"
          alt="Mountain 10"
        />
        <img
          src="/Landing/images/fog_6.png"
          className="parallax fog-6 absolute z-[10] w-[98.47%] top-[71.85%] left-[47.92%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.25"
          data-speedy="0.28"
          data-speedz="0"
          data-rotation="0"
          data-distance="1400"
          alt="Fog 6"
        />
        <img
          src="/Landing/images/mountain_9.png"
          className="parallax mountain-9 absolute z-[5] w-[32.15%] top-[64.69%] left-[18.26%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.125"
          data-speedy="0.155"
          data-speedz="0.15"
          data-rotation="0.02"
          data-distance="1700"
          alt="Mountain 9"
        />
        <img
          src="/Landing/images/mountain_8.png"
          className="parallax mountain-8 absolute z-[6] w-[54.58%] top-[61.85%] left-[35.97%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.1"
          data-speedy="0.11"
          data-speedz="0"
          data-rotation="0.02"
          data-distance="1800"
          alt="Mountain 8"
        />
        <img
          src="/Landing/images/fog_5.png"
          className="parallax fog-5 absolute z-[12] w-[99.65%] top-[68.40%] left-[48.06%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.16"
          data-speedy="0.105"
          data-speedz="0"
          data-rotation="0"
          data-distance="1900"
          alt="Fog 5"
        />
        <img
          src="/Landing/images/mountain_7.png"
          className="parallax mountain-7 absolute z-[8] w-[35.76%] top-[66.54%] left-[71.18%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.1"
          data-speedy="0.1"
          data-speedz="0"
          data-rotation="0.09"
          data-distance="2000"
          alt="Mountain 7"
        />
           {/* Motion elements for text */}
                  <div
            className="text parallax absolute z-[13] top-[calc(50%-130px)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center uppercase text-white pointer-events-auto"
            data-speedx="0.07"
            data-speedy="0.07"
            data-speedz="0"
            data-rotation="0.11"
            data-distance="0"
          >
            {/* Motion.div for Travel Planner (h2) */}
            {/* <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <h2 className="font-thin text-[3.5rem] font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
                Travel Planner
              </h2>
            </motion.div> */}

            {/* Motion.div for Hyped Journey (h1) */}
            {/* <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <h1 className="font-extrabold text-[6rem] leading-[0.88]">
                Hyped Journey
              </h1>
            </motion.div> */}
          </div>
        <img
          src="/Landing/images/mountain_6.png"
          className="parallax mountain-6 absolute z-[10] w-[26.63%] top-[60.68%] left-[90.97%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.065"
          data-speedy="0.05"
          data-speedz="0.05"
          data-rotation="0.12"
          data-distance="2300"
          alt="Mountain 6"
        />
        <img
          src="/Landing/images/fog_4.png"
          className="parallax fog-4 absolute z-[11] w-[37.71%] top-[79.88%] left-[45.83%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.135"
          data-speedy="0.32"
          data-speedz="0"
          data-rotation="0"
          data-distance="2400"
          alt="Fog 4"
        />
        <img
          src="/Landing/images/mountain_5.png"
          className="parallax mountain-5 absolute z-[14] w-[40.49%] top-[83.21%] left-[59.03%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.08"
          data-speedy="0.03"
          data-speedz="0.13"
          data-rotation="0.1"
          data-distance="2550"
          alt="Mountain 5"
        />
        <img
          src="/Landing/images/fog_3.png"
          className="parallax fog-3 absolute z-[7] w-[31.18%] top-[71.11%] left-[52.01%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.11"
          data-speedy="0.018"
          data-speedz="0"
          data-rotation="0"
          data-distance="2800"
          alt="Fog 3"
        />
        <img
          src="/Landing/images/mountain_4.png"
          className="parallax mountain-4 absolute z-[14] w-[49.79%] top-[77.28%] left-[23.51%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.059"
          data-speedy="0.024"
          data-speedz="0.35"
          data-rotation="0.14"
          data-distance="3200"
          alt="Mountain 4"
        />
        <img
          src="/Landing/images/mountain_3.png"
          className="parallax mountain-3 absolute z-[15] w-[29.10%] top-[66.42%] left-[101.11%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.04"
          data-speedy="0.018"
          data-speedz="0.32"
          data-rotation="0.05"
          data-distance="3400"
          alt="Mountain 3"
        />
        <img
          src="/Landing/images/fog_2.png"
          className="parallax fog-2 absolute z-[21] w-[111.11%] top-[5.19%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.15"
          data-speedy="0.0115"
          data-speedz="0"
          data-rotation="0"
          data-distance="3600"
          alt="Fog 2"
        />
        <img
          src="/Landing/images/mountain_2.png"
          className="parallax mountain-2 absolute z-[17] w-[43.40%] top-[73.21%] left-[78.61%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.0235"
          data-speedy="0.013"
          data-speedz="0"
          data-rotation="0.15"
          data-distance="3800"
          alt="Mountain 2"
        />
        <img
          src="/Landing/images/mountain_1.png"
          className="parallax mountain-1 absolute z-[18] w-[31.25%] top-[61.30%] left-[8.26%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.027"
          data-speedy="0.018"
          data-speedz="0.53"
          data-rotation="0.2"
          data-distance="4000"
          alt="Mountain 1"
        />
        <img
          src="/Landing/images/sun_rays.png"
          className="sun-rays absolute z-[19] top-0 right-0 w-[595px] pointer-events-none hidden"
          alt="Sun Rays"
        />
        <img
          src="/Landing/images/black_shadow.png"
          className="black-shadow absolute z-[20] bottom-0 right-0 w-full pointer-events-none hidden"
          alt="Black Shadow"
        />
        <img
          src="/Landing/images/fog_1.png"
          className="parallax fog-1 absolute z-[3] w-[111.11%] top-[5.19%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          data-speedx="0.12"
          data-speedy="0.01"
          data-speedz="0"
          data-rotation="0"
          data-distance="4200"
          alt="Fog 1"
        />
        {/* Add other parallax layers here like before... */}

        {/* Search Form Section on Top */}
        <div className="absolute h-[50vh] w-[60vw] flex flex-col gap-5 z-[20] top-[10vh] left-[50%] transform -translate-x-[50%]">
          <div className="text-white text-center flex flex-col gap-5">
            {/* Motion.div for Travel Planner (h3) */}
            <motion.div
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <h3 className="text-xl font-bold">TRAVEL PLANNER</h3>
            </motion.div>

            {/* Motion.div for Hyped Journey (h2) */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <h2 className="text-6xl font-extrabold">HYPED JOURNEY!</h2>
            </motion.div>
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-3 gap-5 p-5 rounded-xl bg-white bg-opacity-20 backdrop-blur-md z-10">
          <Input
            color="danger"
            variant="bordered"
            startContent={<FaSearch />}
            value={searchLocation}
            onChange={(e) => {
              setSearchLocation(e.target.value);
              searchCities(e.target.value);
            }}
            placeholder="Search Location"
            className="text-white placeholder:text-white"
          />

          {cities.length > 0 && (
            <div 
              className="w-full max-h-[200px] max-w-[315px] border-small rounded-small border-default-200 mt-2 absolute z-50 overflow-y-auto" 
              style={{ top: '100%', left: 0 }}
            >
              <div
                className="bg-cover bg-center bg-no-repeat relative h-full w-full px-1 py-2 rounded-small"
                style={{ backgroundImage: 'url("/home/home-bg.png")' }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-md rounded-small"></div>
                <Listbox
                  aria-label="Actions"
                  onAction={(key) => {
                    setSearchLocation(key as string);
                    setCities([]);
                  }}
                  className="rounded-small"
                >
                  {cities.map((city) => (
                    <ListboxItem key={city} color="danger" className="text-white">
                      {city}
                    </ListboxItem>
                  ))}
                </Listbox>
              </div>
            </div>
          )}

            <Input
              type="date"
              placeholder="Dates"
              variant="bordered"
              color="danger"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
            />
            <Button
              size="lg"
              className="h-full cursor-pointer"
              color="danger"
              variant="shadow"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>

          {/* Activities */}
          <div>
            <ul className="text-white grid grid-cols-5 mt-5 z-10">
              {activities.map((activity) => (
                <li key={activity.name} className="flex items-center justify-center gap-5 flex-col cursor-pointer">
                  <div className="p-5 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300">
                    <div className="relative h-12 w-12">
                      <Image src={activity.icon} fill alt="Activity" />
                    </div>
                  </div>
                  <span className="text-lg font-medium">{activity.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;