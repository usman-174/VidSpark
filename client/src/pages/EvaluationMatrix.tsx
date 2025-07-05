import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, FileText, Tag } from "lucide-react";

const EvaluationMatrix = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [keywordArray, setKeywordArray] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywordsArr = keywords.split(",").map((kw) => kw.trim());
    setKeywordArray(keywordsArr);
    setSubmitted(true);

    // ✅ You can send data to backend here
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Keywords:", keywordsArr);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="bg-teal-700">
        <CardHeader className="bg-teal-700">
          <CardTitle className="text-2xl text-white">Evaluation Matrix Input</CardTitle>

          <CardDescription className="text-white/90">
            Enter video details to evaluate your content effectively.
          </CardDescription>
        </CardHeader>

        <CardContent className="py-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-slate-700" />
                  Title
                </div>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Learn XGBoost Quickly"
                required
                className="focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Pencil className="h-4 w-4 mr-2 text-slate-700" />
                  Description
                </div>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your video..."
                required
                className="focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* Keywords Input */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-slate-700" />
                  Keywords
                </div>
              </label>
              <Input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                required
                className="focus:ring-2 focus:ring-slate-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate keywords with commas.
              </p>
            </div>

            <Button type="submit" className="bg-teal-700">
              Submit for Evaluation
            </Button>
          </form>

          {submitted && title && description && keywordArray.length > 0 && (
  <div className="mt-8 bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4 text-teal-700">Evaluation Summary:</h3>
    
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-600">Title:</p>
      <p className="text-gray-800">{title}</p>
    </div>

    <div className="mb-4">
      <p className="text-sm font-medium text-gray-600">Description:</p>
      <p className="text-gray-800">{description}</p>
    </div>

    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">Keywords:</p>
      <div className="flex flex-wrap gap-2">
        {keywordArray.map((kw, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="px-3 py-1 text-sm bg-teal-700 text-white"
          >
            {kw}
          </Badge>
        ))}
      </div>
    </div>
  </div>
)}

          
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationMatrix;
