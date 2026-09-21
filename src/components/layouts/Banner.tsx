export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        grid
        min-h-screen
        grid-cols-1
        font-noto

        lg:grid-cols-[60%_40%]
      "
    >
      <div
        className="
          hidden
          flex-col
          justify-center
          bg-[#F0F4FB]
          p-20
          pl-24
          lg:flex
          xl:pl-34
        "
      >
        <h1 className="text-5xl font-semibold text-zinc-800 xl:text-7xl">
          Attendance
        </h1>

        <h2 className="mt-2 text-4xl text-blue-900 xl:text-6xl">
          for university classrooms
        </h2>

        <p className="mt-6 max-w-md text-sm text-zinc-500 xl:text-base">
          Record and monitor student attendance in your classroom.
        </p>
      </div>

      <div
        className="
          relative
          flex
          min-h-screen
          items-center
          justify-center
          overflow-hidden
          bg-[#F0F4FB]

          px-4
          py-10

          md:px-10
          md:py-12

          lg:bg-white
          lg:px-6
          lg:py-0
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[420px]
            w-[420px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-blue-100/30
            blur-3xl

            md:h-[520px]
            md:w-[520px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-blue-100/70

            md:-right-32
            md:-top-32
            md:h-80
            md:w-80
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-40
            w-40
            rounded-full
            border-2
            border-blue-200/60

            md:-right-16
            md:-top-16
            md:h-56
            md:w-56
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-8
            top-8
            h-20
            w-20
            rounded-full
            border
            border-blue-200/40

            md:right-16
            md:top-16
            md:h-28
            md:w-28
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-64
            w-64
            rounded-full
            bg-blue-50

            md:-bottom-32
            md:-left-32
            md:h-80
            md:w-80
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-10
            -left-10
            h-40
            w-40
            rounded-full
            border-2
            border-blue-100

            md:-bottom-16
            md:-left-16
            md:h-56
            md:w-56
          "
        />

        <div
          className="
            absolute
            left-7
            top-1/3
            flex
            flex-col
            gap-3

            md:left-14
            md:gap-4
          "
        >
          <span className="h-2 w-2 rounded-full bg-blue-300" />
          <span className="h-3 w-3 rounded-full bg-blue-200" />
          <span className="h-2 w-2 rounded-full bg-blue-300" />
        </div>

        <div
          className="
            absolute
            left-8
            top-20
            h-3
            w-3
            rounded-full
            bg-blue-300

            md:left-16
            md:top-24
            md:h-4
            md:w-4
          "
        />

        <div
          className="
            absolute
            right-8
            top-40
            grid
            grid-cols-4
            gap-2
            opacity-40

            md:right-16
            md:top-48
            md:gap-3
          "
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-400

                md:h-2
                md:w-2
              "
            />
          ))}
        </div>

        <div
          className="
            pointer-events-none
            absolute
            -left-12
            top-[42%]
            h-px
            w-40
            rotate-[-25deg]
            bg-blue-200/60

            md:-left-4
            md:w-56
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-12
            bottom-[38%]
            h-px
            w-40
            rotate-[-25deg]
            bg-blue-200/60

            md:-right-4
            md:w-56
          "
        />

        <div
          className="
            absolute
            left-10
            bottom-36
            h-6
            w-6
            rotate-12
            rounded-lg
            border-2
            border-blue-200/60

            md:left-20
            md:bottom-44
            md:h-8
            md:w-8
          "
        />

        <div
          className="
            absolute
            right-12
            bottom-28
            h-4
            w-4
            rotate-45
            rounded
            bg-blue-200/40

            md:right-24
            md:bottom-36
            md:h-6
            md:w-6
          "
        />

        <div
          className="
            absolute
            bottom-12
            right-8
            grid
            grid-cols-3
            gap-2
            opacity-40

            md:bottom-16
            md:right-16
          "
        >
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-300

                md:h-2
                md:w-2
              "
            />
          ))}
        </div>

        <div
          className="
            relative
            z-20
            w-full
            max-w-[448px]

            md:max-w-[480px]
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
