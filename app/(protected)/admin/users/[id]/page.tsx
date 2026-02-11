"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function UserDetailPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/employees/${params.id}`);
  }, [router, params.id]);

  return null;
}
