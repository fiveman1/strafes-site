import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router";

/** Lets Material UI's links and buttons navigate with react-router. */
const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

export default LinkBehavior;
