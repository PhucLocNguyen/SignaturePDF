function DefaultLayout({ children }) {
  return (
    <div className="relative">
      <p>Default layout</p>
      <div>{children}</div>
    </div>
  );
}

export default DefaultLayout;