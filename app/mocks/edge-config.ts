export const get = async (key: string) => {
  console.log('ran')
  const mockData = {
    redirects: {
      "/local-post/abc": { to: "/blog/abc-redirect", permanent: true },
    },
    deleted: {
      "/local-post/deleted": true,
    },
  } as any;

  return mockData[key];
};
