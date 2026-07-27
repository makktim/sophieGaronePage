interface MenuItem {
  value: string;
  link: string;
  children?: MenuItem[];
}

interface Header {
  menuitem: MenuItem[];
}

interface Intro {
  title1: string;
  title2: string;
  title3: string
  description: string;
  btn1: string;
  btn2: string;
}

interface About {
  title: string;
  description: string;
  paragraph: string;
  btn: string;
}

interface Subscribe {
  title: string;
  description: string;
  btn: string;
}

interface Category {
  title: string;
  icon: string;
  description: string;
}

interface FirstChapter {
  title: string;
  description: string;
  paragraph: string;
  btn: string;
}

interface SocialLink {
  value: string;
  link: string;
  img: string;
  alt: string;
}

interface Social {
  title: string;
  email: string;
  socialLinks: SocialLink[];
}

interface Form {
  title: string;
  btn: string;
}

interface MenuLink {
  title: string;
  link: string;
}

interface FooterLink {
  title: string;
  menu: MenuLink[];
}

interface Footer {
  social: Social;
  form: Form;
  links: FooterLink[];
}

interface ContentItem {
  Header: Header;
  intro: Intro;
  about: About;
  subscribe: Subscribe;
  categories: Category[];
  firstChapter: FirstChapter;
  footer: Footer;
}

interface CartState {
  content: ContentItem;
  language: string;
  isOpen: boolean;
}
