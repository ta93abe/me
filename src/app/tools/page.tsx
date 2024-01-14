import { fetchTools } from "@/libs/microcms";

export default async function Page() {
  const { contents } = await fetchTools();

  return (
    <main className="flex flex-col min-h-screen justify-center items-center">
      <h1 className="text-4xl">Tools</h1>
      <ul>
        {contents.map((content) => (
          <li key={content.id}>
            <img
              src={content.icon.url}
              width={content.icon.width}
              height={content.icon.height}
              alt="icon"
            />
            <a href={content.website} target="_blank" rel="noreferrer">
              {content.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
