import React, { useState } from "react";
import { Box, Button, Text, Image  } from "grommet";
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
      <Box direction="row" align="center" gap="small">
        <Image src="favicon.ico" width="72px" height="72px" /> {/* Adjust size if needed */}
        <Text size="large">{header}</Text>
      </Box>
      <Button icon={darkMode ? <Moon /> : <Sun />} onClick={toggleDarkMode} />
    </Box>
  );
};

export default NavBar;

