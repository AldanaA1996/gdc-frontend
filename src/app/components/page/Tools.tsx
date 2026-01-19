//form to add a new tool

import Layout from "@/app/components/layout";
import AddToolForm from "../addTool-form";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuthenticationStore } from "@/app/store/authentication";

export function AddTool() {
  return (
    <Layout>
      <div>
        <div className="p-3">
          <AddToolForm />
        </div>
      </div>
    </Layout>
  );
}
export default AddTool;
