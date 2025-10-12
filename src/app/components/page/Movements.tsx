"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import Layout from "@/app/components/layout";
import MovementsView from "../movementsView";
import { useState } from "react";

export function Movements() {
  const [filterBy, setFilterBy] = useState<"tool" | "material" | undefined>("tool");

  return (
    <Layout>
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
          <Tabs
            defaultValue="tools"
            className="w-full max-w-3xl mx-auto pt-3 pb-2"
            onValueChange={(value) => {
              setFilterBy(value === "tools" ? "tool" : "material");
            }}
          >
            <TabsList className="flex justify-center w-11/12 mx-auto bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="tools"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium"
              >
                🧰 Herramientas
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium"
              >
                📦 Inventario
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto px-4 py-4">
              <TabsContent value="tools">
                <div className="max-w-5xl mx-auto">
                  <MovementsView tableName="activity" filterBy={filterBy} />
                </div>
              </TabsContent>

              <TabsContent value="inventory">
                <div className="max-w-5xl mx-auto">
                  <MovementsView tableName="activity" filterBy={filterBy} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
