"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RotateCw, HelpCircle, X, Upload, ChevronRight, Grid3x3 } from "lucide-react";

const ancestryCards = [
  { id: 1, name: "Clank", image: "https://ext.same-assets.com/2698655591/974273112.webp", category: "ancestry" },
  { id: 2, name: "Drakana", image: "https://ext.same-assets.com/2698655591/2445136968.webp", category: "ancestry" },
  { id: 3, name: "Dwarf", image: "https://ext.same-assets.com/2698655591/2264066286.webp", category: "ancestry" },
  { id: 4, name: "Elf", image: "https://ext.same-assets.com/2698655591/2077389843.webp", category: "ancestry" },
  { id: 5, name: "Faerie", image: "https://ext.same-assets.com/2698655591/1406645107.webp", category: "ancestry" },
  { id: 6, name: "Faun", image: "https://ext.same-assets.com/2698655591/3482026081.webp", category: "ancestry" },
];

const classCards = [
  { id: 101, name: "Bard", image: "https://ext.same-assets.com/2698655591/974273112.webp", category: "class" },
  { id: 102, name: "Guardian", image: "https://ext.same-assets.com/2698655591/2445136968.webp", category: "class" },
  { id: 103, name: "Ranger", image: "https://ext.same-assets.com/2698655591/2264066286.webp", category: "class" },
  { id: 104, name: "Rogue", image: "https://ext.same-assets.com/2698655591/2077389843.webp", category: "class" },
  { id: 105, name: "Seraph", image: "https://ext.same-assets.com/2698655591/1406645107.webp", category: "class" },
  { id: 106, name: "Sorcerer", image: "https://ext.same-assets.com/2698655591/3482026081.webp", category: "class" },
];

const domainCards = [
  { id: 201, name: "Arcana", image: "https://ext.same-assets.com/2698655591/1571735549.webp", category: "domain" },
  { id: 202, name: "Blade", image: "https://ext.same-assets.com/2698655591/7716652.webp", category: "domain" },
  { id: 203, name: "Bone", image: "https://ext.same-assets.com/2698655591/3916009364.webp", category: "domain" },
  { id: 204, name: "Grace", image: "https://ext.same-assets.com/2698655591/1854087848.webp", category: "domain" },
  { id: 205, name: "Sage", image: "https://ext.same-assets.com/2698655591/3968401418.webp", category: "domain" },
  { id: 206, name: "Valor", image: "https://ext.same-assets.com/2698655591/1506275159.webp", category: "domain" },
];

const adversaryCards = [
  { id: 301, name: "Dragon", image: "https://ext.same-assets.com/2698655591/3324488874.webp", category: "adversary" },
  { id: 302, name: "Goblin Chief", image: "https://ext.same-assets.com/2698655591/1215511856.webp", category: "adversary" },
  { id: 303, name: "Undead Knight", image: "https://ext.same-assets.com/2698655591/659465483.webp", category: "adversary" },
  { id: 304, name: "Demon", image: "https://ext.same-assets.com/2698655591/22063292.webp", category: "adversary" },
];

const allCards = [...ancestryCards, ...classCards, ...domainCards, ...adversaryCards];

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ancestryExpanded, setAncestryExpanded] = useState(true);
  const [classExpanded, setClassExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);
  const [adversaryExpanded, setAdversaryExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<typeof allCards[0] | null>(null);

  // Editable card content
  const [cardTitle, setCardTitle] = useState("");
  const [cardType, setCardType] = useState("ANCESTRY");
  const [cardDescription, setCardDescription] = useState("Clanks are sentient mechanical beings built from a variety of materials, including metal, wood, and stone.");
  const [ability1Title, setAbility1Title] = useState("Purposeful Design");
  const [ability1Text, setAbility1Text] = useState("Decide who made you and for what purpose. At character creation, choose one of your Experiences that best aligns with this purpose and gain a permanent +1 bonus to it.");
  const [ability2Title, setAbility2Title] = useState("Efficient");
  const [ability2Text, setAbility2Text] = useState("When you take a short rest, you can choose a long rest move instead of a short rest move.");
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Card settings state
  const [damageThresholds, setDamageThresholds] = useState(false);
  const [showAsText, setShowAsText] = useState(false);
  const [cardBorder, setCardBorder] = useState(true);
  const [artistName, setArtistName] = useState(true);
  const [cutLines, setCutLines] = useState(false);
  const [gutters, setGutters] = useState(false);
  const [cardBack, setCardBack] = useState(false);
  const [cardEdges, setCardEdges] = useState<"square" | "rounded">("square");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const filteredAncestry = ancestryCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDomains = domainCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdversaries = adversaryCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (card: typeof allCards[0]) => {
    setSelectedCard(card);
    setShowWelcome(false);
    setCardTitle(card.name);
    setCardType(card.category.toUpperCase());
    setCustomImage(null);
  };

  const handleCloseEditor = () => {
    setSelectedCard(null);
    setCustomImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `${cardTitle}-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [63, 88], // Standard card size
      });

      pdf.addImage(imgData, "PNG", 0, 0, 63, 88);
      pdf.save(`${cardTitle}-card.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-[#1c1d28] border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#2a2b3a] border-[#3a3b4a] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Base Card Templates */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Base Card Templates</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            {/* Ancestry Section */}
            <div className="mb-4">
              <button
                onClick={() => setAncestryExpanded(!ancestryExpanded)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors mb-2"
              >
                <span className="text-sm font-medium text-foreground">Ancestry</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {filteredAncestry.length}
                  </span>
                  <span className={`transition-transform ${ancestryExpanded ? "" : "-rotate-90"}`}>
                    −
                  </span>
                </div>
              </button>

              {ancestryExpanded && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {filteredAncestry.map((card) => (
                    <div
                      key={card.id}
                      className="aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => handleCardClick(card)}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium text-center">{card.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Classes Section */}
            <div className="mb-4">
              <button
                onClick={() => setClassExpanded(!classExpanded)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors mb-2"
              >
                <span className="text-sm font-medium text-foreground">Classes</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {filteredClasses.length}
                  </span>
                  <span className={`transition-transform ${classExpanded ? "" : "-rotate-90"}`}>
                    −
                  </span>
                </div>
              </button>

              {classExpanded && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {filteredClasses.map((card) => (
                    <div
                      key={card.id}
                      className="aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => handleCardClick(card)}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium text-center">{card.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Domains Section */}
            <div className="mb-4">
              <button
                onClick={() => setDomainExpanded(!domainExpanded)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors mb-2"
              >
                <span className="text-sm font-medium text-foreground">Domains</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {filteredDomains.length}
                  </span>
                  <span className={`transition-transform ${domainExpanded ? "" : "-rotate-90"}`}>
                    −
                  </span>
                </div>
              </button>

              {domainExpanded && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {filteredDomains.map((card) => (
                    <div
                      key={card.id}
                      className="aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => handleCardClick(card)}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium text-center">{card.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adversaries Section */}
            <div className="mb-4">
              <button
                onClick={() => setAdversaryExpanded(!adversaryExpanded)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors mb-2"
              >
                <span className="text-sm font-medium text-foreground">Adversaries</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {filteredAdversaries.length}
                  </span>
                  <span className={`transition-transform ${adversaryExpanded ? "" : "-rotate-90"}`}>
                    −
                  </span>
                </div>
              </button>

              {adversaryExpanded && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {filteredAdversaries.map((card) => (
                    <div
                      key={card.id}
                      className="aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => handleCardClick(card)}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium text-center">{card.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <a
              href="https://pixeltable.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              PixelTable
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#1c1d28] border-b border-border flex items-center justify-center gap-4 px-6 relative">
          <Button variant="ghost" size="icon" className="absolute left-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </Button>
          <img
            src="https://ext.same-assets.com/2698655591/3435922477.png"
            alt="Daggerheart Logo"
            className="h-10"
          />
          {selectedCard && (
            <div className="absolute right-6 flex items-center gap-2">
              <span className="bg-[#2a2b3a] px-3 py-1.5 rounded text-sm text-foreground">
                {cardTitle}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCloseEditor}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div
          className="flex-1 relative flex"
          style={{
            backgroundImage: "url('https://ext.same-assets.com/2698655591/2894399564.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {selectedCard ? (
            <>
              {/* Card Editor View */}
              <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-auto">
                <div className="mb-4">
                  <h1 className="text-4xl font-bold text-foreground mb-1">{cardType}</h1>
                  <p className="text-sm text-muted-foreground">Last updated: Oct 29, 2025 1:33 pm</p>
                </div>

                {/* Card Preview */}
                <div
                  ref={cardRef}
                  className={`relative w-[400px] aspect-[2/3] ${cardEdges === 'rounded' ? 'rounded-2xl' : 'rounded-sm'} overflow-hidden shadow-2xl ${cardBorder ? 'border-4 border-[#d4a84a]' : ''}`}
                >
                  <div className="absolute inset-0 bg-[#f5f0e8] p-6 flex flex-col">
                    {/* Upload area */}
                    <div
                      className="flex-1 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {customImage ? (
                        <img src={customImage} alt="Custom" className="w-full h-full object-cover" />
                      ) : (
                         <div className="text-center">
                           <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded flex items-center justify-center">
                             <Upload className="w-6 h-6 text-gray-600" />
                           </div>
                           <p className="text-sm text-gray-600">Upload Custom Image</p>
                         </div>
                       )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {/* Card content */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <input
                          type="text"
                          value={cardTitle}
                          onChange={(e) => setCardTitle(e.target.value)}
                          className="text-3xl font-bold uppercase bg-transparent border-none outline-none flex-1"
                        />
                        <input
                          type="text"
                          value={cardType}
                          onChange={(e) => setCardType(e.target.value)}
                          className="bg-[#d4a84a] text-black px-3 py-1 rounded text-xs font-bold text-center w-24"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <textarea
                          value={cardDescription}
                          onChange={(e) => setCardDescription(e.target.value)}
                          className="italic w-full bg-transparent border-none outline-none resize-none"
                          rows={2}
                        />

                        <div>
                          <input
                            type="text"
                            value={ability1Title}
                            onChange={(e) => setAbility1Title(e.target.value)}
                            className="font-bold italic bg-transparent border-none outline-none w-auto"
                          />
                          <span>: </span>
                          <textarea
                            value={ability1Text}
                            onChange={(e) => setAbility1Text(e.target.value)}
                            className="inline-block align-top bg-transparent border-none outline-none resize-none w-full"
                            rows={3}
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={ability2Title}
                            onChange={(e) => setAbility2Title(e.target.value)}
                            className="font-bold italic bg-transparent border-none outline-none w-auto"
                          />
                          <span>: </span>
                          <textarea
                            value={ability2Text}
                            onChange={(e) => setAbility2Text(e.target.value)}
                            className="inline-block align-top bg-transparent border-none outline-none resize-none w-full"
                            rows={2}
                          />
                        </div>
                      </div>

                      {artistName && (
                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
                          <span className="italic">Artist Name</span>
                          <div className="flex items-center gap-1">
                            <span>Daggerheart™ Compatible. Terms at Daggerheart.com</span>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Card Properties */}
              <aside className="w-96 bg-[#1c1d28] border-l border-border overflow-auto">
                <div className="p-6 space-y-6">
                  {/* Card Properties Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Card Properties</h2>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Header Image */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Header Image</h3>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-[#4a4b5f] hover:bg-[#5a5b6f] text-foreground"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>

                  {/* Base Settings */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Base Settings</h3>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={damageThresholds}
                        onChange={(e) => setDamageThresholds(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-[#2a2b3a] text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Damage Thresholds</span>
                    </label>

                    {damageThresholds && (
                      <label className="flex items-center gap-2 ml-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showAsText}
                          onChange={(e) => setShowAsText(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-[#2a2b3a] text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Show as text</span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cardBorder}
                        onChange={(e) => setCardBorder(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-[#2a2b3a] text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Card Border</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={artistName}
                        onChange={(e) => setArtistName(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-[#2a2b3a] text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Artist Name</span>
                    </label>
                  </div>

                  {/* Card Edges */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Card Edges</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCardEdges("square")}
                        className={`px-3 py-2 rounded text-sm font-medium ${cardEdges === 'square' ? 'bg-[#8da9e3] text-[#1c1d28]' : 'bg-[#2a2b3a] text-foreground hover:bg-[#3a3b4a]'}`}
                      >
                        Square
                      </button>
                      <button
                        onClick={() => setCardEdges("rounded")}
                        className={`px-3 py-2 rounded text-sm font-medium ${cardEdges === 'rounded' ? 'bg-[#8da9e3] text-[#1c1d28]' : 'bg-[#2a2b3a] text-foreground hover:bg-[#3a3b4a]'}`}
                      >
                        Rounded
                      </button>
                    </div>
                  </div>

                  {/* Export */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium text-foreground">Export</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Select export option below.</p>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleExportPDF}
                        className="flex-1 bg-[#2a2b3a] hover:bg-[#3a3b4a] text-foreground text-xs"
                      >
                        Print PDF (300dpi)
                      </Button>
                      <Button
                        onClick={handleExportPNG}
                        className="flex-1 bg-[#2a2b3a] hover:bg-[#3a3b4a] text-foreground text-xs"
                      >
                        Web PNG (72dpi)
                      </Button>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Cut Lines</span>
                      <button
                        onClick={() => setCutLines(!cutLines)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          cutLines ? "bg-[#8da9e3]" : "bg-[#2a2b3a]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            cutLines ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Gutters</span>
                      <button
                        onClick={() => setGutters(!gutters)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          gutters ? "bg-[#8da9e3]" : "bg-[#2a2b3a]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            gutters ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Card Back</span>
                      <button
                        onClick={() => setCardBack(!cardBack)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          cardBack ? "bg-[#8da9e3]" : "bg-[#2a2b3a]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            cardBack ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    onClick={handleExportPNG}
                    className="w-full bg-[#8da9e3] hover:bg-[#7a98d0] text-[#1c1d28] font-semibold py-3"
                  >
                    EXPORT
                  </Button>
                </div>
              </aside>
            </>
          ) : (
             <>
               {/* Welcome Dialog */}
               <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
                 <DialogContent className="sm:max-w-[500px] bg-[#2d2e42] border-[#4a4b5f] text-foreground">
                   <DialogTitle className="sr-only">Welcome Dialog</DialogTitle>
                   <div className="flex flex-col items-center text-center py-6 px-4">
                     <svg
                       className="w-16 h-16 mb-6 text-primary"
                       viewBox="0 0 24 24"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="1.5"
                     >
                       <rect x="2" y="6" width="20" height="12" rx="2" />
                       <path d="M2 10h20" />
                       <path d="M6 6V4" />
                       <path d="M10 6V4" />
                       <path d="M14 6V4" />
                       <path d="M18 6V4" />
                     </svg>
                     <h2 className="text-2xl font-bold mb-4">Welcome to the Daggerheart Card Editor!</h2>
                     <p className="text-muted-foreground mb-2">
                       Need Help? Let's make a card together! I'll guide you through each step of the
                       process.
                     </p>
                     <p className="text-muted-foreground mb-6">Click the button below to start the tour.</p>
                     <Button className="bg-[#8da9e3] hover:bg-[#7a98d0] text-[#1c1d28]">
                       Start Tour
                     </Button>
                   </div>
                 </DialogContent>
               </Dialog>
             </>
           )}
        </div>
      </main>
    </div>
  );
}
