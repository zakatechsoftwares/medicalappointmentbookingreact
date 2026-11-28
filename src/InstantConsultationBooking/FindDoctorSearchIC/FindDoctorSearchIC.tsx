import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { FALLBACK_SPECIALITIES } from "../../utils/specialities";


/** Search box plus speciality chips. Both live in the URL so results can be shared or refreshed. */
const FindDoctorSearchIC = () => {
  const [params, setParams] = useSearchParams();
  const speciality = params.get("speciality") ?? "";
  const [query, setQuery] = useState(params.get("search") ?? "");
  const [specialities, setSpecialities] = useState<string[]>(FALLBACK_SPECIALITIES);

  useEffect(() => {
    api<string[]>("/api/doctors/specialities")
      .then((list) => list.length && setSpecialities(list))
      .catch(() => {});
  }, []);

  // Keep the box in step if the URL changes (e.g. back button)
  useEffect(() => setQuery(params.get("search") ?? ""), [params]);

  const update = (next: { speciality?: string; search?: string }) => {
    const p = new URLSearchParams();
    const s = next.speciality ?? speciality;
    const q = (next.search ?? query).trim();
    if (s) p.set("speciality", s);
    if (q) p.set("search", q);
    setParams(p);
  };

  return (
    <div className="finder">
      <form
        className="finder-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ search: query });
        }}
      >
        <label htmlFor="finder-q" className="visually-hidden">
          Search doctors by name or speciality
        </label>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="finder-icon">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="finder-q"
          className="input"
          type="search"
          placeholder="Doctor's name or speciality"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <div className="chip-row chip-row-scroll" aria-label="Filter by speciality">
        <button type="button" className="chip" aria-pressed={!speciality} onClick={() => update({ speciality: "" })}>
          All doctors
        </button>
        {specialities.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={speciality.toLowerCase() === s.toLowerCase()}
            onClick={() => update({ speciality: s })}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FindDoctorSearchIC;
