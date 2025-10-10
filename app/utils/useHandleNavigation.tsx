const handleNavigation = (section: string) => {
  if (typeof window !== "undefined") {
    if (window.location.pathname === "/") {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = `/?section=${section}`;
    }
  }
};

export default handleNavigation;
