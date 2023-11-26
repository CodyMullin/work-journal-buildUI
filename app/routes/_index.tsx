import { type MetaFunction, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, Link } from '@remix-run/react'
import { PrismaClient } from '@prisma/client'
import { format, parseISO, startOfWeek } from "date-fns";
import { useEffect, useRef } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  let db = new PrismaClient();
  let entries = await db.entry.findMany();

  console.log(entries)

  return entries.map((entry) => ({
    ...entry,
    date: entry.date.toISOString().substring(0, 80)
  }));
}

export async function action({ request }: ActionFunctionArgs) {
  await new Promise((resolve) => setTimeout(resolve, 8000))
  let db = new PrismaClient();

  let formData = await request.formData();
  let { date, type, text } = Object.fromEntries(formData)

  if (
    typeof date !== 'string' ||
    typeof type !== 'string' ||
    typeof text !== 'string'
  ) {
    throw new Error('Bad Request')
  }

  return db.entry.create({
    data: {
      date: new Date(date),
      type: type,
      text: text
    }
  })
}

export default function Index() {
  let entries = useLoaderData<typeof loader>();
  let fetcher = useFetcher();
  let textRef = useRef<HTMLTextAreaElement>(null);

  let entriesByWeek = entries.reduce<Record<string, typeof entries>>((memo, entry) => {
    let sunday = startOfWeek(parseISO(entry.date))
    let sundayString = format(sunday, 'yyyy-MM-dd');

    memo[sundayString] ||= []
    memo[sundayString].push(entry)

    return memo;
  }, {})

  let weeks = Object.keys(entriesByWeek)
    .sort((a, b) => a.localeCompare(b))
    .map((dateString) => ({
      dateString,
      work: entriesByWeek[dateString].filter(entry => entry.type === 'work'),
      learnings: entriesByWeek[dateString].filter(entry => entry.type === 'learnings'),
      interestingThings: entriesByWeek[dateString].filter(entry => entry.type === 'interesting-thing'),
    }))

  useEffect(() => {
    if (fetcher.state === 'submitting' && textRef.current) {
      textRef.current.value = '';
      textRef.current.focus();
    }
  }, [fetcher.state])
  

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-4xl text-white">Work Journal</h1>
      <p className="mt-3 text-xl text-gray-400">
        Doings and learnings. Updated weekly
      </p>

      <div className="my-8 border p-3">
        <fetcher.Form method="post">
          <p className="italic">Create an Entry</p>

          <fieldset
            className="disabled:opacity-80"
            disabled={fetcher.state === 'submitting'}>
          <div className="mt-4">
            <div>
              <input type="date" required name="date" className="text-gray-700" defaultValue={format(new Date(), 'yyyy-MM-dd')}/>
            </div>

            <div className="mt-2 space-x-6">
              <label>
                <input required type="radio" name="type" value="work" className="mr-1" defaultChecked/>
                Work
              </label>
              <label>
                <input type="radio" name="type" value="learning" className="mr-1" />
                Learning
              </label>
              <label>
                <input type="radio" name="type" value="interesting-thing" className="mr-1" />
                Interesting Thing
              </label>
            </div>

            <div className="mt-2">
              <textarea ref={textRef} name="text" required className="w-full text-gray-700" placeholder="Write your entry..."></textarea>
            </div>

            <div className="mt-1 text-right">
              <button className="bg-blue-500 px-4 py-1 font-medium text-white" type="submit">
                {fetcher.state === 'submitting' ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          </fieldset>
        </fetcher.Form>
      </div>

      <div className="mt-12 space-y-12">
        {weeks.map((week) => (
          <div key={week.dateString} className="mt-6">
            <p className="font-bold">
              Week of {format(parseISO(week.dateString), "MMMM do")}
            </p>
          <div className="mt-3 space-y-4">
            {week.work.length > 0 && (
              <div>
                <p>Work</p>
                <ul className="ml-8 list-disc">
                  {week.work.map((entry) => (
                    <li key={entry.id}>{entry.text}
                    <Link to={`/entries/${entry.id}/edit`} className="ml-2 text-blue-500 group-hover:opacity-80">
                      Edit
                    </Link>
                    </li>

                  ))}
                </ul>
              </div>
            )}
            {week.learnings.length > 0 && (
              <div>
                <p>Learnings</p>
                <ul className="ml-8 list-disc">
                  {week.learnings.map((entry) => (
                    <li key={entry.id}>{entry.text}
                    <Link to={`/entries/${entry.id}/edit`} className="ml-2 text-blue-500 group-hover:opacity-80">
                      Edit
                    </Link></li>
                  ))}
                </ul>
              </div>
            )}
            {week.interestingThings.length > 0 && (
              <div>
                <p>Interesting Things</p>
                <ul className="ml-8 list-disc">
                  {week.interestingThings.map((entry) => (
                    <li key={entry.id}>{entry.text}
                    <Link to={`/entries/${entry.id}/edit`} className="ml-2 text-blue-500 group-hover:opacity-80">
                      Edit
                    </Link></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </div>
        ))}
      </div>
      <div>
        
      </div>
    </div>
  );
}
