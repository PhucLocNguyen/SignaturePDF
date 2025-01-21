import React from "react";
import { Route } from "react-router";
import PrivateRouting from "./PrivateRouting";

const RenderRoute = (route, index, isPrivate = false) => {
  const Layout = route.layout || React.Fragment; // Use Fragment if no layout specified
  const Page = route.component;

  return (
    <Route key={index} element={isPrivate ? <PrivateRouting /> : undefined}>
      <Route
        index={route.index}
        path={index != null ? route.path : undefined} // Use path if it's defined
        element={
          Page != null ? (
            <Layout>
              <Page />
            </Layout>
          ) : null
        }
      >
        {route.children?.map((childRoute, childIndex) => {
          const ChildPage = childRoute.component;
          const LayoutChild = childRoute.layout || Layout;
          return (
            <Route
              key={childIndex}
              index={childRoute.index}
              path={childRoute.path}
              element={
                <LayoutChild>
                  <ChildPage />
                </LayoutChild>
              }
            />
          );
        })}
      </Route>
    </Route>
  );
};

export default RenderRoute;
