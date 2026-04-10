export async function fetchRedditPosts() {
  try {
    const res = await fetch(
      "https://www.reddit.com/r/all/top.json?limit=10"
    );

    const data = await res.json();

    return data.data.children.map((post) => ({
      title: post.data.title
    }));
  } catch (err) {
    console.error("Reddit fetch error:", err.message);
    return [];
  }
}