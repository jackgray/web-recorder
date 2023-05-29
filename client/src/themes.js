import { grommet } from "grommet";
import { deepMerge } from "grommet/utils";


const lightPalette = {
  brand: "#228BE6",
  background: "#e2dbd9",
  text: "#282e40",
  // Add more light mode colors here
};

const darkPalette = {
  brand: "#5C95FF",
  background: "#282e40",
  text: "#e2dbd9",
  // Add more dark mode colors here
};

export const commonTheme = {
  global: {
    font: {
      family: "Rajdhani",
      size: {
        xsmall: "8px",
        small: "12px",
        medium: "16px",
        large: "18px",
        xlarge: "20px",
        xxlarge: "24px",
      },
      height: "1.5em",
    },
    breakpoints: {
      xsmall: {
        value: 576,
      },
      small: {
        value: 768,
      },
      medium: {
        value: 992,
      },
      large: {
        value: 1200,
      },
      xlarge: {
        value: 1440,
      },
    },
  },
  heading: {
    font: {
      family: "Rajdhani",
      size: {
        xsmall: "18px",
        small: "20px",
        medium: "24px",
        large: "28px",
        xlarge: "32px",
        xxlarge: "36px",
      },
      height: "30px",
      pad: {
        xsmall: "10px",
        small: "15px",
        medium: "20px",
        large: "25px",
        xlarge: "30px",
        xxlarge: "35px",
      },
    },
  },
  text: {
    font: {
      family: "Rajdhani",
      size: {
        xsmall: "12px",
        small: "14px",
        medium: "16px",
        large: "18px",
        xlarge: "20px",
        xxlarge: "22px",
      },
      height: "20px",
    },
  },
  select: {
    control: {
      extend: {
        fontSize: {
          xsmall: "12px",
          small: "14px",
          medium: "16px",
          large: "18px",
          xlarge: "20px",
          xxlarge: "22px",
        },
      },
    },
  },
};

export const lightTheme = deepMerge(grommet, {
  ...commonTheme,
  global: {
    colors: lightPalette,
    ...commonTheme.global,
  },
});

export const darkTheme = deepMerge(grommet, {
  ...commonTheme,
  global: {
    colors: darkPalette,
    ...commonTheme.global,
  },
});
