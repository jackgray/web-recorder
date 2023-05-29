import React, { useState } from "react";
import { Box, Button, Text } from "grommet";
import { Moon, Sun } from "grommet-icons";

const NavBar = ({ darkMode, toggleDarkMode, header }) => {
  return (
    <Box
      direction="row"
      align="center"
      justify="between"
      background={darkMode ? "dark-1" : "light-1"}
      elevation="medium"
      pad={{ horizontal: "medium", vertical: "small" }}
    >
      <Text size="large">{header}</Text>
      <Button icon={darkMode ? <Moon /> : <Sun />} onClick={toggleDarkMode} />
    </Box>
  );
};

export default NavBar;
