import { STORAGE_KEYS } from "@/lib/storageKeys";

export type LocationCategory = 'Pays' | 'Régions' | 'Provinces' | 'Arrondissements' | 'Communes' | 'Localités';

export interface LocationEntry {
    id: string;
    name: string;
    type: LocationCategory;
    parentId?: string;
    code?: string;
    level?: number;
    postalCode?: string;
}

const fallbackLocations: LocationEntry[] = [
    { id: 'be', name: 'Belgique', type: 'Pays' },
    { id: 'wal', name: 'Wallonie', type: 'Régions', parentId: 'be' },
    { id: 'bru', name: 'Région de Bruxelles-Capitale', type: 'Régions', parentId: 'be' },
    { id: 'vla', name: 'Flandre', type: 'Régions', parentId: 'be' },
    { id: 'bw', name: 'Brabant Wallon', type: 'Provinces', parentId: 'wal' },
    { id: 'lg', name: 'Liège', type: 'Provinces', parentId: 'wal' },
    { id: 'na', name: 'Namur', type: 'Provinces', parentId: 'wal' },
    { id: 'ha', name: 'Hainaut', type: 'Provinces', parentId: 'wal' },
    { id: 'lx', name: 'Luxembourg', type: 'Provinces', parentId: 'wal' },
    { id: 'ant', name: 'Anvers', type: 'Provinces', parentId: 'vla' },
    { id: 'lim', name: 'Limbourg', type: 'Provinces', parentId: 'vla' },
    { id: 'ovl', name: 'Flandre-Orientale', type: 'Provinces', parentId: 'vla' },
    { id: 'wvl', name: 'Flandre-Occidentale', type: 'Provinces', parentId: 'vla' },
    { id: 'bx', name: 'Bruxelles', type: 'Provinces', parentId: 'bru' },

    // Arrondissement de Verviers (63xxx)
    { id: 'arr-ve', name: 'Arrondissement de Verviers', type: 'Arrondissements', parentId: 'lg', code: '63000' },
    { id: 'com-ve', name: 'Verviers', type: 'Communes', parentId: 'arr-ve' },
    { id: 'loc-ve-4800', name: '4800 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4800' },
    { id: 'loc-ve-4801', name: '4801 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4801' },
    { id: 'loc-ve-4802', name: '4802 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4802' },
    { id: 'loc-ve-4860', name: '4860 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4860' },
    { id: 'loc-ve-4870', name: '4870 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4870' },
    { id: 'loc-ve-4770', name: '4770 Amblève', type: 'Localités', parentId: 'arr-ve', postalCode: '4770' },
    { id: 'loc-ve-4820', name: '4820 Dison', type: 'Localités', parentId: 'arr-ve', postalCode: '4820' },
    { id: 'loc-ve-4700', name: '4700 Eupen', type: 'Localités', parentId: 'arr-ve', postalCode: '4700' },
    { id: 'loc-ve-4710', name: '4710 Lontzen', type: 'Localités', parentId: 'arr-ve', postalCode: '4710' },
    { id: 'loc-ve-4877', name: '4877 Olne', type: 'Localités', parentId: 'arr-ve', postalCode: '4877' },
    { id: 'loc-ve-4730', name: '4730 Raeren', type: 'Localités', parentId: 'arr-ve', postalCode: '4730' },
    { id: 'loc-ve-4910', name: '4910 Theux', type: 'Localités', parentId: 'arr-ve', postalCode: '4910' },
    { id: 'loc-ve-4790', name: '4790 Burg-Reuland', type: 'Localités', parentId: 'arr-ve', postalCode: '4790' },

    // Arrondissement de Liège (62xxx)
    { id: 'arr-lg', name: 'Arrondissement de Liège', type: 'Arrondissements', parentId: 'lg', code: '62000' },
    { id: 'com-lg', name: 'Liège', type: 'Communes', parentId: 'arr-lg' },
    { id: 'loc-lg-4000', name: '4000 Liège', type: 'Localités', parentId: 'arr-lg', postalCode: '4000' },
    { id: 'loc-lg-4020', name: '4020 Bressoux', type: 'Localités', parentId: 'arr-lg', postalCode: '4020' },
    { id: 'loc-lg-4030', name: '4030 Grivegnée', type: 'Localités', parentId: 'arr-lg', postalCode: '4030' },
    { id: 'loc-lg-4040', name: '4040 Herstal', type: 'Localités', parentId: 'arr-lg', postalCode: '4040' },
    { id: 'loc-lg-4050', name: '4050 Chaudfontaine', type: 'Localités', parentId: 'arr-lg', postalCode: '4050' },
    { id: 'loc-lg-4100', name: '4100 Seraing', type: 'Localités', parentId: 'arr-lg', postalCode: '4100' },
    { id: 'loc-lg-4120', name: '4120 Neupré', type: 'Localités', parentId: 'arr-lg', postalCode: '4120' },
    { id: 'loc-lg-4130', name: '4130 Tilff', type: 'Localités', parentId: 'arr-lg', postalCode: '4130' },
    { id: 'loc-lg-4140', name: '4140 Durbuy', type: 'Localités', parentId: 'arr-lg', postalCode: '4140' },
    { id: 'loc-lg-4160', name: '4160 Wanze', type: 'Localités', parentId: 'arr-lg', postalCode: '4160' },
    { id: 'loc-lg-4180', name: '4180 Comblain-au-Pont', type: 'Localités', parentId: 'arr-lg', postalCode: '4180' },
    { id: 'loc-lg-4190', name: '4190 Ferrières', type: 'Localités', parentId: 'arr-lg', postalCode: '4190' },
    { id: 'loc-lg-4210', name: '4210 Burdinne', type: 'Localités', parentId: 'arr-lg', postalCode: '4210' },
    { id: 'loc-lg-4250', name: '4250 Geer', type: 'Localités', parentId: 'arr-lg', postalCode: '4250' },
    { id: 'loc-lg-4260', name: '4260 Ciney', type: 'Localités', parentId: 'arr-lg', postalCode: '4260' },
    { id: 'loc-lg-4280', name: '4280 Hannut', type: 'Localités', parentId: 'arr-lg', postalCode: '4280' },
    { id: 'loc-lg-4300', name: '4300 Waremme', type: 'Localités', parentId: 'arr-lg', postalCode: '4300' },
    { id: 'loc-lg-4340', name: '4340 Awans', type: 'Localités', parentId: 'arr-lg', postalCode: '4340' },
    { id: 'loc-lg-4350', name: '4350 Remicourt', type: 'Localités', parentId: 'arr-lg', postalCode: '4350' },
    { id: 'loc-lg-4360', name: '4360 Oreye', type: 'Localités', parentId: 'arr-lg', postalCode: '4360' },
    { id: 'loc-lg-4400', name: '4400 Flémalle', type: 'Localités', parentId: 'arr-lg', postalCode: '4400' },
    { id: 'loc-lg-4420', name: '4420 Saint-Nicolas', type: 'Localités', parentId: 'arr-lg', postalCode: '4420' },
    { id: 'loc-lg-4430', name: '4430 Ans', type: 'Localités', parentId: 'arr-lg', postalCode: '4430' },
    { id: 'loc-lg-4450', name: '4450 Juprelle', type: 'Localités', parentId: 'arr-lg', postalCode: '4450' },
    { id: 'loc-lg-4460', name: '4460 Grâce-Hollogne', type: 'Localités', parentId: 'arr-lg', postalCode: '4460' },
    { id: 'loc-lg-4480', name: '4480 Engis', type: 'Localités', parentId: 'arr-lg', postalCode: '4480' },
    { id: 'loc-lg-4500', name: '4500 Huy', type: 'Localités', parentId: 'arr-lg', postalCode: '4500' },
    { id: 'loc-lg-4520', name: '4520 Bas-Oha', type: 'Localités', parentId: 'arr-lg', postalCode: '4520' },
    { id: 'loc-lg-4530', name: '4530 Villers-le-Bouillet', type: 'Localités', parentId: 'arr-lg', postalCode: '4530' },
    { id: 'loc-lg-4540', name: '4540 Amay', type: 'Localités', parentId: 'arr-lg', postalCode: '4540' },
    { id: 'loc-lg-4560', name: '4560 Clavier', type: 'Localités', parentId: 'arr-lg', postalCode: '4560' },
    { id: 'loc-lg-4570', name: '4570 Marchin', type: 'Localités', parentId: 'arr-lg', postalCode: '4570' },
    { id: 'loc-lg-4590', name: '4590 Ouffet', type: 'Localités', parentId: 'arr-lg', postalCode: '4590' },
    { id: 'loc-lg-4600', name: '4600 Visé', type: 'Localités', parentId: 'arr-lg', postalCode: '4600' },
    { id: 'loc-lg-4630', name: '4630 Soumagne', type: 'Localités', parentId: 'arr-lg', postalCode: '4630' },
    { id: 'loc-lg-4650', name: '4650 Herve', type: 'Localités', parentId: 'arr-lg', postalCode: '4650' },
    { id: 'loc-lg-4670', name: '4670 Blégny', type: 'Localités', parentId: 'arr-lg', postalCode: '4670' },
    { id: 'loc-lg-4680', name: '4680 Oupeye', type: 'Localités', parentId: 'arr-lg', postalCode: '4680' },
    { id: 'loc-lg-4690', name: '4690 Bassenge', type: 'Localités', parentId: 'arr-lg', postalCode: '4690' },

    // Arrondissement de Bruxelles (21xxx)
    { id: 'arr-bx', name: 'Arrondissement de Bruxelles', type: 'Arrondissements', parentId: 'bx', code: '21000' },
    { id: 'com-bx', name: 'Bruxelles', type: 'Communes', parentId: 'arr-bx' },
    { id: 'loc-bx-1000', name: '1000 Bruxelles', type: 'Localités', parentId: 'arr-bx', postalCode: '1000' },
    { id: 'loc-bx-1020', name: '1020 Laeken', type: 'Localités', parentId: 'arr-bx', postalCode: '1020' },
    { id: 'loc-bx-1030', name: '1030 Schaerbeek', type: 'Localités', parentId: 'arr-bx', postalCode: '1030' },
    { id: 'loc-bx-1040', name: '1040 Etterbeek', type: 'Localités', parentId: 'arr-bx', postalCode: '1040' },
    { id: 'loc-bx-1050', name: '1050 Ixelles', type: 'Localités', parentId: 'arr-bx', postalCode: '1050' },
    { id: 'loc-bx-1060', name: '1060 Saint-Gilles', type: 'Localités', parentId: 'arr-bx', postalCode: '1060' },
    { id: 'loc-bx-1070', name: '1070 Anderlecht', type: 'Localités', parentId: 'arr-bx', postalCode: '1070' },
    { id: 'loc-bx-1080', name: '1080 Molenbeek-Saint-Jean', type: 'Localités', parentId: 'arr-bx', postalCode: '1080' },
    { id: 'loc-bx-1081', name: '1081 Koekelberg', type: 'Localités', parentId: 'arr-bx', postalCode: '1081' },
    { id: 'loc-bx-1082', name: '1082 Berchem-Sainte-Agathe', type: 'Localités', parentId: 'arr-bx', postalCode: '1082' },
    { id: 'loc-bx-1083', name: '1083 Ganshoren', type: 'Localités', parentId: 'arr-bx', postalCode: '1083' },
    { id: 'loc-bx-1090', name: '1090 Jette', type: 'Localités', parentId: 'arr-bx', postalCode: '1090' },
    { id: 'loc-bx-1120', name: '1120 Neder-Over-Heembeek', type: 'Localités', parentId: 'arr-bx', postalCode: '1120' },
    { id: 'loc-bx-1130', name: '1130 Haren', type: 'Localités', parentId: 'arr-bx', postalCode: '1130' },
    { id: 'loc-bx-1140', name: '1140 Evere', type: 'Localités', parentId: 'arr-bx', postalCode: '1140' },
    { id: 'loc-bx-1150', name: '1150 Woluwe-Saint-Pierre', type: 'Localités', parentId: 'arr-bx', postalCode: '1150' },
    { id: 'loc-bx-1160', name: '1160 Auderghem', type: 'Localités', parentId: 'arr-bx', postalCode: '1160' },
    { id: 'loc-bx-1170', name: '1170 Watermael-Boitsfort', type: 'Localités', parentId: 'arr-bx', postalCode: '1170' },
    { id: 'loc-bx-1180', name: '1180 Uccle', type: 'Localités', parentId: 'arr-bx', postalCode: '1180' },
    { id: 'loc-bx-1190', name: '1190 Forest', type: 'Localités', parentId: 'arr-bx', postalCode: '1190' },
    { id: 'loc-bx-1200', name: '1200 Woluwe-Saint-Lambert', type: 'Localités', parentId: 'arr-bx', postalCode: '1200' },
    { id: 'loc-bx-1210', name: '1210 Saint-Josse-ten-Noode', type: 'Localités', parentId: 'arr-bx', postalCode: '1210' },

    // Arrondissement d'Anvers (11xxx)
    { id: 'arr-an', name: 'Arrondissement d\'Anvers', type: 'Arrondissements', parentId: 'ant', code: '11000' },
    { id: 'com-an', name: 'Anvers', type: 'Communes', parentId: 'arr-an' },
    { id: 'loc-an-2000', name: '2000 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2000' },
    { id: 'loc-an-2018', name: '2018 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2018' },
    { id: 'loc-an-2020', name: '2020 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2020' },
    { id: 'loc-an-2030', name: '2030 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2030' },
    { id: 'loc-an-2040', name: '2040 Zandvliet', type: 'Localités', parentId: 'arr-an', postalCode: '2040' },
    { id: 'loc-an-2050', name: '2050 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2050' },
    { id: 'loc-an-2060', name: '2060 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2060' },
    { id: 'loc-an-2100', name: '2100 Deurne', type: 'Localités', parentId: 'arr-an', postalCode: '2100' },
    { id: 'loc-an-2140', name: '2140 Borgerhout', type: 'Localités', parentId: 'arr-an', postalCode: '2140' },
    { id: 'loc-an-2170', name: '2170 Merksem', type: 'Localités', parentId: 'arr-an', postalCode: '2170' },
    { id: 'loc-an-2180', name: '2180 Ekeren', type: 'Localités', parentId: 'arr-an', postalCode: '2180' },
    { id: 'loc-an-2200', name: '2200 Herentals', type: 'Localités', parentId: 'arr-an', postalCode: '2200' },
    { id: 'loc-an-2300', name: '2300 Turnhout', type: 'Localités', parentId: 'arr-an', postalCode: '2300' },
    { id: 'loc-an-2400', name: '2400 Mol', type: 'Localités', parentId: 'arr-an', postalCode: '2400' },
    { id: 'loc-an-2500', name: '2500 Lier', type: 'Localités', parentId: 'arr-an', postalCode: '2500' },
    { id: 'loc-an-2600', name: '2600 Berchem', type: 'Localités', parentId: 'arr-an', postalCode: '2600' },
    { id: 'loc-an-2610', name: '2610 Wilrijk', type: 'Localités', parentId: 'arr-an', postalCode: '2610' },
    { id: 'loc-an-2630', name: '2630 Aartselaar', type: 'Localités', parentId: 'arr-an', postalCode: '2630' },
    { id: 'loc-an-2640', name: '2640 Mortsel', type: 'Localités', parentId: 'arr-an', postalCode: '2640' },
    { id: 'loc-an-2650', name: '2650 Edegem', type: 'Localités', parentId: 'arr-an', postalCode: '2650' },
    { id: 'loc-an-2660', name: '2660 Hoboken', type: 'Localités', parentId: 'arr-an', postalCode: '2660' },
    { id: 'loc-an-2800', name: '2800 Mechelen', type: 'Localités', parentId: 'arr-an', postalCode: '2800' },
    { id: 'loc-an-2850', name: '2850 Boom', type: 'Localités', parentId: 'arr-an', postalCode: '2850' },
    { id: 'loc-an-2900', name: '2900 Schoten', type: 'Localités', parentId: 'arr-an', postalCode: '2900' },
    { id: 'loc-an-2950', name: '2950 Kapellen', type: 'Localités', parentId: 'arr-an', postalCode: '2950' },

    // Arrondissement de Huy (arrondissement de Liège) - déjà inclus dans arr-lg ci-dessus

    // Arrondissement de Namur (91xxx)
    { id: 'arr-na', name: 'Arrondissement de Namur', type: 'Arrondissements', parentId: 'na', code: '91000' },
    { id: 'com-na', name: 'Namur', type: 'Communes', parentId: 'arr-na' },
    { id: 'loc-na-5000', name: '5000 Namur', type: 'Localités', parentId: 'arr-na', postalCode: '5000' },
    { id: 'loc-na-5020', name: '5020 Malonne', type: 'Localités', parentId: 'arr-na', postalCode: '5020' },
    { id: 'loc-na-5030', name: '5030 Gembloux', type: 'Localités', parentId: 'arr-na', postalCode: '5030' },
    { id: 'loc-na-5060', name: '5060 Sambreville', type: 'Localités', parentId: 'arr-na', postalCode: '5060' },
    { id: 'loc-na-5070', name: '5070 Fosses-la-Ville', type: 'Localités', parentId: 'arr-na', postalCode: '5070' },
    { id: 'loc-na-5080', name: '5080 Ramillies', type: 'Localités', parentId: 'arr-na', postalCode: '5080' },
    { id: 'loc-na-5100', name: '5100 Jambes', type: 'Localités', parentId: 'arr-na', postalCode: '5100' },
    { id: 'loc-na-5300', name: '5300 Andenne', type: 'Localités', parentId: 'arr-na', postalCode: '5300' },
    { id: 'loc-na-5330', name: '5330 Assesse', type: 'Localités', parentId: 'arr-na', postalCode: '5330' },
    { id: 'loc-na-5350', name: '5350 Ohey', type: 'Localités', parentId: 'arr-na', postalCode: '5350' },
    { id: 'loc-na-5360', name: '5360 Hamois', type: 'Localités', parentId: 'arr-na', postalCode: '5360' },
    { id: 'loc-na-5370', name: '5370 Florennes', type: 'Localités', parentId: 'arr-na', postalCode: '5370' },
    { id: 'loc-na-5380', name: '5380 Fernelmont', type: 'Localités', parentId: 'arr-na', postalCode: '5380' },
    { id: 'loc-na-5500', name: '5500 Dinant', type: 'Localités', parentId: 'arr-na', postalCode: '5500' },
    { id: 'loc-na-5520', name: '5520 Onhaye', type: 'Localités', parentId: 'arr-na', postalCode: '5520' },
    { id: 'loc-na-5530', name: '5530 Yvoir', type: 'Localités', parentId: 'arr-na', postalCode: '5530' },
    { id: 'loc-na-5540', name: '5540 Hastière', type: 'Localités', parentId: 'arr-na', postalCode: '5540' },
    { id: 'loc-na-5550', name: '5550 Vresse-sur-Semois', type: 'Localités', parentId: 'arr-na', postalCode: '5550' },
    { id: 'loc-na-5560', name: '5560 Houyet', type: 'Localités', parentId: 'arr-na', postalCode: '5560' },
    { id: 'loc-na-5570', name: '5570 Beauraing', type: 'Localités', parentId: 'arr-na', postalCode: '5570' },
    { id: 'loc-na-5580', name: '5580 Rochefort', type: 'Localités', parentId: 'arr-na', postalCode: '5580' },
    { id: 'loc-na-5590', name: '5590 Ciney', type: 'Localités', parentId: 'arr-na', postalCode: '5590' },

    // Arrondissement de Charleroi (52xxx)
    { id: 'arr-ch', name: 'Arrondissement de Charleroi', type: 'Arrondissements', parentId: 'ha', code: '52000' },
    { id: 'com-ch', name: 'Charleroi', type: 'Communes', parentId: 'arr-ch' },
    { id: 'loc-ch-6000', name: '6000 Charleroi', type: 'Localités', parentId: 'arr-ch', postalCode: '6000' },
    { id: 'loc-ch-6010', name: '6010 Couillet', type: 'Localités', parentId: 'arr-ch', postalCode: '6010' },
    { id: 'loc-ch-6020', name: '6020 Dampremy', type: 'Localités', parentId: 'arr-ch', postalCode: '6020' },
    { id: 'loc-ch-6030', name: '6030 Marchienne-au-Pont', type: 'Localités', parentId: 'arr-ch', postalCode: '6030' },
    { id: 'loc-ch-6040', name: '6040 Jumet', type: 'Localités', parentId: 'arr-ch', postalCode: '6040' },
    { id: 'loc-ch-6041', name: '6041 Gosselies', type: 'Localités', parentId: 'arr-ch', postalCode: '6041' },
    { id: 'loc-ch-6042', name: '6042 Lodelinsart', type: 'Localités', parentId: 'arr-ch', postalCode: '6042' },
    { id: 'loc-ch-6043', name: '6043 Ransart', type: 'Localités', parentId: 'arr-ch', postalCode: '6043' },
    { id: 'loc-ch-6044', name: '6044 Roux', type: 'Localités', parentId: 'arr-ch', postalCode: '6044' },
    { id: 'loc-ch-6060', name: '6060 Gilly', type: 'Localités', parentId: 'arr-ch', postalCode: '6060' },
    { id: 'loc-ch-6061', name: '6061 Montignies-sur-Sambre', type: 'Localités', parentId: 'arr-ch', postalCode: '6061' },
    { id: 'loc-ch-6110', name: '6110 Montigny-le-Tilleul', type: 'Localités', parentId: 'arr-ch', postalCode: '6110' },
    { id: 'loc-ch-6120', name: '6120 Ham-sur-Heure-Nalinnes', type: 'Localités', parentId: 'arr-ch', postalCode: '6120' },
    { id: 'loc-ch-6140', name: '6140 Fontaine-l\'Évêque', type: 'Localités', parentId: 'arr-ch', postalCode: '6140' },
    { id: 'loc-ch-6141', name: '6141 Fontaine-l\'Évêque', type: 'Localités', parentId: 'arr-ch', postalCode: '6141' },
    { id: 'loc-ch-6180', name: '6180 Courcelles', type: 'Localités', parentId: 'arr-ch', postalCode: '6180' },
    { id: 'loc-ch-6181', name: '6181 Courcelles', type: 'Localités', parentId: 'arr-ch', postalCode: '6181' },
    { id: 'loc-ch-6182', name: '6182 Courcelles', type: 'Localités', parentId: 'arr-ch', postalCode: '6182' },
    { id: 'loc-ch-6183', name: '6183 Courcelles', type: 'Localités', parentId: 'arr-ch', postalCode: '6183' },
    { id: 'loc-ch-6200', name: '6200 Châtelet', type: 'Localités', parentId: 'arr-ch', postalCode: '6200' },
    { id: 'loc-ch-6210', name: '6210 Châtelet', type: 'Localités', parentId: 'arr-ch', postalCode: '6210' },
    { id: 'loc-ch-6220', name: '6220 Fleurus', type: 'Localités', parentId: 'arr-ch', postalCode: '6220' },
    { id: 'loc-ch-6221', name: '6221 Fleurus', type: 'Localités', parentId: 'arr-ch', postalCode: '6221' },
    { id: 'loc-ch-6222', name: '6222 Fleurus', type: 'Localités', parentId: 'arr-ch', postalCode: '6222' },
    { id: 'loc-ch-6223', name: '6223 Fleurus', type: 'Localités', parentId: 'arr-ch', postalCode: '6223' },
    { id: 'loc-ch-6224', name: '6224 Fleurus', type: 'Localités', parentId: 'arr-ch', postalCode: '6224' },
    { id: 'loc-ch-6230', name: '6230 Thuin', type: 'Localités', parentId: 'arr-ch', postalCode: '6230' },
    { id: 'loc-ch-6238', name: '6238 Lobbes', type: 'Localités', parentId: 'arr-ch', postalCode: '6238' },
    { id: 'loc-ch-6240', name: '6240 Farciennes', type: 'Localités', parentId: 'arr-ch', postalCode: '6240' },
    { id: 'loc-ch-6250', name: '6250 Aiseau-Presles', type: 'Localités', parentId: 'arr-ch', postalCode: '6250' },
    { id: 'loc-ch-6440', name: '6440 Fourmies', type: 'Localités', parentId: 'arr-ch', postalCode: '6440' },
    { id: 'loc-ch-6460', name: '6460 Chimay', type: 'Localités', parentId: 'arr-ch', postalCode: '6460' },
    { id: 'loc-ch-6470', name: '6470 Sivry-Rance', type: 'Localités', parentId: 'arr-ch', postalCode: '6470' },
    { id: 'loc-ch-6500', name: '6500 Beaumont', type: 'Localités', parentId: 'arr-ch', postalCode: '6500' },
    { id: 'loc-ch-6530', name: '6530 Thuin', type: 'Localités', parentId: 'arr-ch', postalCode: '6530' },
    { id: 'loc-ch-6531', name: '6531 Bienne-lez-Happart', type: 'Localités', parentId: 'arr-ch', postalCode: '6531' },
    { id: 'loc-ch-6532', name: '6532 Bienne-lez-Happart', type: 'Localités', parentId: 'arr-ch', postalCode: '6532' },
    { id: 'loc-ch-6533', name: '6533 Bienne-lez-Happart', type: 'Localités', parentId: 'arr-ch', postalCode: '6533' },
    { id: 'loc-ch-6534', name: '6534 Bienne-lez-Happart', type: 'Localités', parentId: 'arr-ch', postalCode: '6534' },
    { id: 'loc-ch-6536', name: '6536 Thuin', type: 'Localités', parentId: 'arr-ch', postalCode: '6536' },
    { id: 'loc-ch-6540', name: '6540 Lobbes', type: 'Localités', parentId: 'arr-ch', postalCode: '6540' },
    { id: 'loc-ch-6542', name: '6542 Sars-la-Bruyère', type: 'Localités', parentId: 'arr-ch', postalCode: '6542' },
    { id: 'loc-ch-6560', name: '6560 Erquelinnes', type: 'Localités', parentId: 'arr-ch', postalCode: '6560' },
    { id: 'loc-ch-6567', name: '6567 Merbes-le-Château', type: 'Localités', parentId: 'arr-ch', postalCode: '6567' },
    { id: 'loc-ch-6590', name: '6590 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6590' },
    { id: 'loc-ch-6591', name: '6591 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6591' },
    { id: 'loc-ch-6592', name: '6592 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6592' },
    { id: 'loc-ch-6593', name: '6593 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6593' },
    { id: 'loc-ch-6594', name: '6594 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6594' },
    { id: 'loc-ch-6596', name: '6596 Momignies', type: 'Localités', parentId: 'arr-ch', postalCode: '6596' },
    { id: 'loc-ch-7000', name: '7000 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7000' },
    { id: 'loc-ch-7010', name: '7010 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7010' },
    { id: 'loc-ch-7011', name: '7011 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7011' },
    { id: 'loc-ch-7012', name: '7012 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7012' },
    { id: 'loc-ch-7020', name: '7020 Nimy', type: 'Localités', parentId: 'arr-ch', postalCode: '7020' },
    { id: 'loc-ch-7021', name: '7021 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7021' },
    { id: 'loc-ch-7022', name: '7022 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7022' },
    { id: 'loc-ch-7024', name: '7024 Ciply', type: 'Localités', parentId: 'arr-ch', postalCode: '7024' },
    { id: 'loc-ch-7030', name: '7030 Saint-Symphorien', type: 'Localités', parentId: 'arr-ch', postalCode: '7030' },
    { id: 'loc-ch-7031', name: '7031 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7031' },
    { id: 'loc-ch-7032', name: '7032 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7032' },
    { id: 'loc-ch-7033', name: '7033 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7033' },
    { id: 'loc-ch-7034', name: '7034 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7034' },
    { id: 'loc-ch-7040', name: '7040 Aulnois', type: 'Localités', parentId: 'arr-ch', postalCode: '7040' },
    { id: 'loc-ch-7041', name: '7041 Mons', type: 'Localités', parentId: 'arr-ch', postalCode: '7041' },
    { id: 'loc-ch-7050', name: '7050 Herchies', type: 'Localités', parentId: 'arr-ch', postalCode: '7050' },
    { id: 'loc-ch-7060', name: '7060 Soignies', type: 'Localités', parentId: 'arr-ch', postalCode: '7060' },
    { id: 'loc-ch-7061', name: '7061 Soignies', type: 'Localités', parentId: 'arr-ch', postalCode: '7061' },
    { id: 'loc-ch-7062', name: '7062 Soignies', type: 'Localités', parentId: 'arr-ch', postalCode: '7062' },
    { id: 'loc-ch-7063', name: '7063 Soignies', type: 'Localités', parentId: 'arr-ch', postalCode: '7063' },
    { id: 'loc-ch-7070', name: '7070 Le Roeulx', type: 'Localités', parentId: 'arr-ch', postalCode: '7070' },
    { id: 'loc-ch-7080', name: '7080 La Louvière', type: 'Localités', parentId: 'arr-ch', postalCode: '7080' },
    { id: 'loc-ch-7100', name: '7100 La Louvière', type: 'Localités', parentId: 'arr-ch', postalCode: '7100' },
    { id: 'loc-ch-7110', name: '7110 Houdeng-Aimeries', type: 'Localités', parentId: 'arr-ch', postalCode: '7110' },
    { id: 'loc-ch-7120', name: '7120 Estinnes', type: 'Localités', parentId: 'arr-ch', postalCode: '7120' },
    { id: 'loc-ch-7130', name: '7130 Binche', type: 'Localités', parentId: 'arr-ch', postalCode: '7130' },
    { id: 'loc-ch-7131', name: '7131 Binche', type: 'Localités', parentId: 'arr-ch', postalCode: '7131' },
    { id: 'loc-ch-7133', name: '7133 Binche', type: 'Localités', parentId: 'arr-ch', postalCode: '7133' },
    { id: 'loc-ch-7134', name: '7134 Binche', type: 'Localités', parentId: 'arr-ch', postalCode: '7134' },
    { id: 'loc-ch-7140', name: '7140 Morlanwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7140' },
    { id: 'loc-ch-7141', name: '7141 Morlanwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7141' },
    { id: 'loc-ch-7160', name: '7160 Chapelle-lez-Herlaimont', type: 'Localités', parentId: 'arr-ch', postalCode: '7160' },
    { id: 'loc-ch-7170', name: '7170 Manage', type: 'Localités', parentId: 'arr-ch', postalCode: '7170' },
    { id: 'loc-ch-7180', name: '7180 Seneffe', type: 'Localités', parentId: 'arr-ch', postalCode: '7180' },
    { id: 'loc-ch-7181', name: '7181 Seneffe', type: 'Localités', parentId: 'arr-ch', postalCode: '7181' },
    { id: 'loc-ch-7190', name: '7190 Ecaussinnes', type: 'Localités', parentId: 'arr-ch', postalCode: '7190' },
    { id: 'loc-ch-7300', name: '7300 Boussu', type: 'Localités', parentId: 'arr-ch', postalCode: '7300' },
    { id: 'loc-ch-7301', name: '7301 Boussu', type: 'Localités', parentId: 'arr-ch', postalCode: '7301' },
    { id: 'loc-ch-7320', name: '7320 Bernissart', type: 'Localités', parentId: 'arr-ch', postalCode: '7320' },
    { id: 'loc-ch-7321', name: '7321 Bernissart', type: 'Localités', parentId: 'arr-ch', postalCode: '7321' },
    { id: 'loc-ch-7330', name: '7330 Saint-Ghislain', type: 'Localités', parentId: 'arr-ch', postalCode: '7330' },
    { id: 'loc-ch-7331', name: '7331 Saint-Ghislain', type: 'Localités', parentId: 'arr-ch', postalCode: '7331' },
    { id: 'loc-ch-7332', name: '7332 Saint-Ghislain', type: 'Localités', parentId: 'arr-ch', postalCode: '7332' },
    { id: 'loc-ch-7333', name: '7333 Saint-Ghislain', type: 'Localités', parentId: 'arr-ch', postalCode: '7333' },
    { id: 'loc-ch-7334', name: '7334 Saint-Ghislain', type: 'Localités', parentId: 'arr-ch', postalCode: '7334' },
    { id: 'loc-ch-7340', name: '7340 Colfontaine', type: 'Localités', parentId: 'arr-ch', postalCode: '7340' },
    { id: 'loc-ch-7350', name: '7350 Hensies', type: 'Localités', parentId: 'arr-ch', postalCode: '7350' },
    { id: 'loc-ch-7370', name: '7370 Dour', type: 'Localités', parentId: 'arr-ch', postalCode: '7370' },
    { id: 'loc-ch-7380', name: '7380 Quiévrain', type: 'Localités', parentId: 'arr-ch', postalCode: '7380' },
    { id: 'loc-ch-7390', name: '7390 Quaregnon', type: 'Localités', parentId: 'arr-ch', postalCode: '7390' },
    { id: 'loc-ch-7500', name: '7500 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7500' },
    { id: 'loc-ch-7501', name: '7501 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7501' },
    { id: 'loc-ch-7502', name: '7502 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7502' },
    { id: 'loc-ch-7503', name: '7503 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7503' },
    { id: 'loc-ch-7504', name: '7504 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7504' },
    { id: 'loc-ch-7520', name: '7520 Ramegnies-Chin', type: 'Localités', parentId: 'arr-ch', postalCode: '7520' },
    { id: 'loc-ch-7530', name: '7530 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7530' },
    { id: 'loc-ch-7531', name: '7531 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7531' },
    { id: 'loc-ch-7532', name: '7532 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7532' },
    { id: 'loc-ch-7533', name: '7533 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7533' },
    { id: 'loc-ch-7534', name: '7534 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7534' },
    { id: 'loc-ch-7536', name: '7536 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7536' },
    { id: 'loc-ch-7538', name: '7538 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7538' },
    { id: 'loc-ch-7540', name: '7540 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7540' },
    { id: 'loc-ch-7548', name: '7548 Tournai', type: 'Localités', parentId: 'arr-ch', postalCode: '7548' },
    { id: 'loc-ch-7600', name: '7600 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7600' },
    { id: 'loc-ch-7601', name: '7601 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7601' },
    { id: 'loc-ch-7602', name: '7602 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7602' },
    { id: 'loc-ch-7603', name: '7603 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7603' },
    { id: 'loc-ch-7604', name: '7604 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7604' },
    { id: 'loc-ch-7608', name: '7608 Péruwelz', type: 'Localités', parentId: 'arr-ch', postalCode: '7608' },
    { id: 'loc-ch-7620', name: '7620 Brunehaut', type: 'Localités', parentId: 'arr-ch', postalCode: '7620' },
    { id: 'loc-ch-7640', name: '7640 Antoing', type: 'Localités', parentId: 'arr-ch', postalCode: '7640' },
    { id: 'loc-ch-7700', name: '7700 Mouscron', type: 'Localités', parentId: 'arr-ch', postalCode: '7700' },
    { id: 'loc-ch-7711', name: '7711 Mouscron', type: 'Localités', parentId: 'arr-ch', postalCode: '7711' },
    { id: 'loc-ch-7712', name: '7712 Mouscron', type: 'Localités', parentId: 'arr-ch', postalCode: '7712' },
    { id: 'loc-ch-7730', name: '7730 Estaimpuis', type: 'Localités', parentId: 'arr-ch', postalCode: '7730' },
    { id: 'loc-ch-7740', name: '7740 Pecq', type: 'Localités', parentId: 'arr-ch', postalCode: '7740' },
    { id: 'loc-ch-7742', name: '7742 Pecq', type: 'Localités', parentId: 'arr-ch', postalCode: '7742' },
    { id: 'loc-ch-7743', name: '7743 Pecq', type: 'Localités', parentId: 'arr-ch', postalCode: '7743' },
    { id: 'loc-ch-7750', name: '7750 Mont-de-l\'Enclus', type: 'Localités', parentId: 'arr-ch', postalCode: '7750' },
    { id: 'loc-ch-7760', name: '7760 Celles', type: 'Localités', parentId: 'arr-ch', postalCode: '7760' },
    { id: 'loc-ch-7780', name: '7780 Comines-Warneton', type: 'Localités', parentId: 'arr-ch', postalCode: '7780' },
    { id: 'loc-ch-7781', name: '7781 Comines-Warneton', type: 'Localités', parentId: 'arr-ch', postalCode: '7781' },
    { id: 'loc-ch-7782', name: '7782 Comines-Warneton', type: 'Localités', parentId: 'arr-ch', postalCode: '7782' },
    { id: 'loc-ch-7783', name: '7783 Comines-Warneton', type: 'Localités', parentId: 'arr-ch', postalCode: '7783' },
    { id: 'loc-ch-7784', name: '7784 Comines-Warneton', type: 'Localités', parentId: 'arr-ch', postalCode: '7784' },
    { id: 'loc-ch-7800', name: '7800 Ath', type: 'Localités', parentId: 'arr-ch', postalCode: '7800' },
    { id: 'loc-ch-7801', name: '7801 Ath', type: 'Localités', parentId: 'arr-ch', postalCode: '7801' },
    { id: 'loc-ch-7802', name: '7802 Ath', type: 'Localités', parentId: 'arr-ch', postalCode: '7802' },
    { id: 'loc-ch-7803', name: '7803 Ath', type: 'Localités', parentId: 'arr-ch', postalCode: '7803' },
    { id: 'loc-ch-7804', name: '7804 Ath', type: 'Localités', parentId: 'arr-ch', postalCode: '7804' },
    { id: 'loc-ch-7810', name: '7810 Maffle', type: 'Localités', parentId: 'arr-ch', postalCode: '7810' },
    { id: 'loc-ch-7811', name: '7811 Arbre', type: 'Localités', parentId: 'arr-ch', postalCode: '7811' },
    { id: 'loc-ch-7812', name: '7812 Houtaing', type: 'Localités', parentId: 'arr-ch', postalCode: '7812' },
    { id: 'loc-ch-7822', name: '7822 Ghislenghien', type: 'Localités', parentId: 'arr-ch', postalCode: '7822' },
    { id: 'loc-ch-7823', name: '7823 Gibecq', type: 'Localités', parentId: 'arr-ch', postalCode: '7823' },
    { id: 'loc-ch-7830', name: '7830 Silly', type: 'Localités', parentId: 'arr-ch', postalCode: '7830' },
    { id: 'loc-ch-7850', name: '7850 Enghien', type: 'Localités', parentId: 'arr-ch', postalCode: '7850' },
    { id: 'loc-ch-7860', name: '7860 Lessines', type: 'Localités', parentId: 'arr-ch', postalCode: '7860' },
    { id: 'loc-ch-7861', name: '7861 Lessines', type: 'Localités', parentId: 'arr-ch', postalCode: '7861' },
    { id: 'loc-ch-7870', name: '7870 Lens', type: 'Localités', parentId: 'arr-ch', postalCode: '7870' },
    { id: 'loc-ch-7880', name: '7880 Flobecq', type: 'Localités', parentId: 'arr-ch', postalCode: '7880' },
    { id: 'loc-ch-7890', name: '7890 Ellezelles', type: 'Localités', parentId: 'arr-ch', postalCode: '7890' },
    { id: 'loc-ch-7900', name: '7900 Leuze-en-Hainaut', type: 'Localités', parentId: 'arr-ch', postalCode: '7900' },
    { id: 'loc-ch-7901', name: '7901 Leuze-en-Hainaut', type: 'Localités', parentId: 'arr-ch', postalCode: '7901' },
    { id: 'loc-ch-7903', name: '7903 Leuze-en-Hainaut', type: 'Localités', parentId: 'arr-ch', postalCode: '7903' },
    { id: 'loc-ch-7904', name: '7904 Leuze-en-Hainaut', type: 'Localités', parentId: 'arr-ch', postalCode: '7904' },
    { id: 'loc-ch-7910', name: '7910 Frasnes-lez-Anvaing', type: 'Localités', parentId: 'arr-ch', postalCode: '7910' },
    { id: 'loc-ch-7911', name: '7911 Frasnes-lez-Anvaing', type: 'Localités', parentId: 'arr-ch', postalCode: '7911' },
    { id: 'loc-ch-7912', name: '7912 Frasnes-lez-Anvaing', type: 'Localités', parentId: 'arr-ch', postalCode: '7912' },
    { id: 'loc-ch-7940', name: '7940 Brugelette', type: 'Localités', parentId: 'arr-ch', postalCode: '7940' },
    { id: 'loc-ch-7950', name: '7950 Chièvres', type: 'Localités', parentId: 'arr-ch', postalCode: '7950' },
    { id: 'loc-ch-7951', name: '7951 Chièvres', type: 'Localités', parentId: 'arr-ch', postalCode: '7951' },
    { id: 'loc-ch-7970', name: '7970 Beloeil', type: 'Localités', parentId: 'arr-ch', postalCode: '7970' },
    { id: 'loc-ch-7971', name: '7971 Beloeil', type: 'Localités', parentId: 'arr-ch', postalCode: '7971' },
    { id: 'loc-ch-7972', name: '7972 Beloeil', type: 'Localités', parentId: 'arr-ch', postalCode: '7972' },
    { id: 'loc-ch-7973', name: '7973 Beloeil', type: 'Localités', parentId: 'arr-ch', postalCode: '7973' },

    // Arrondissement de Tournai-Mouscron (arrondissement de Tournai)
    { id: 'arr-to', name: 'Arrondissement de Tournai', type: 'Arrondissements', parentId: 'ha', code: '57000' },
    { id: 'com-to', name: 'Tournai', type: 'Communes', parentId: 'arr-to' },

    // Arrondissement de Mons (arrondissement de Mons)
    { id: 'arr-mo', name: 'Arrondissement de Mons', type: 'Arrondissements', parentId: 'ha', code: '53000' },
    { id: 'com-mo', name: 'Mons', type: 'Communes', parentId: 'arr-mo' },

    // Arrondissement de Gand (35xxx)
    { id: 'arr-ga', name: 'Arrondissement de Gand', type: 'Arrondissements', parentId: 'ovl', code: '35000' },
    { id: 'com-ga', name: 'Gand', type: 'Communes', parentId: 'arr-ga' },
    { id: 'loc-ga-9000', name: '9000 Gand', type: 'Localités', parentId: 'arr-ga', postalCode: '9000' },
    { id: 'loc-ga-9030', name: '9030 Mariakerke', type: 'Localités', parentId: 'arr-ga', postalCode: '9030' },
    { id: 'loc-ga-9031', name: '9031 Drongen', type: 'Localités', parentId: 'arr-ga', postalCode: '9031' },
    { id: 'loc-ga-9032', name: '9032 Wondelgem', type: 'Localités', parentId: 'arr-ga', postalCode: '9032' },
    { id: 'loc-ga-9040', name: '9040 Sint-Amandsberg', type: 'Localités', parentId: 'arr-ga', postalCode: '9040' },
    { id: 'loc-ga-9041', name: '9041 Oostakker', type: 'Localités', parentId: 'arr-ga', postalCode: '9041' },
    { id: 'loc-ga-9042', name: '9042 Desteldonk', type: 'Localités', parentId: 'arr-ga', postalCode: '9042' },
    { id: 'loc-ga-9050', name: '9050 Gentbrugge', type: 'Localités', parentId: 'arr-ga', postalCode: '9050' },
    { id: 'loc-ga-9051', name: '9051 Afsnee', type: 'Localités', parentId: 'arr-ga', postalCode: '9051' },
    { id: 'loc-ga-9052', name: '9052 Zwijnaarde', type: 'Localités', parentId: 'arr-ga', postalCode: '9052' },
    { id: 'loc-ga-9070', name: '9070 Destelbergen', type: 'Localités', parentId: 'arr-ga', postalCode: '9070' },
    { id: 'loc-ga-9080', name: '9080 Beervelde', type: 'Localités', parentId: 'arr-ga', postalCode: '9080' },
    { id: 'loc-ga-9090', name: '9090 Melle', type: 'Localités', parentId: 'arr-ga', postalCode: '9090' },
    { id: 'loc-ga-9100', name: '9100 Sint-Niklaas', type: 'Localités', parentId: 'arr-ga', postalCode: '9100' },
    { id: 'loc-ga-9111', name: '9111 Belsele', type: 'Localités', parentId: 'arr-ga', postalCode: '9111' },
    { id: 'loc-ga-9120', name: '9120 Beveren', type: 'Localités', parentId: 'arr-ga', postalCode: '9120' },
    { id: 'loc-ga-9130', name: '9130 Kallo', type: 'Localités', parentId: 'arr-ga', postalCode: '9130' },
    { id: 'loc-ga-9140', name: '9140 Temse', type: 'Localités', parentId: 'arr-ga', postalCode: '9140' },
    { id: 'loc-ga-9150', name: '9150 Kruibeke', type: 'Localités', parentId: 'arr-ga', postalCode: '9150' },
    { id: 'loc-ga-9160', name: '9160 Lokeren', type: 'Localités', parentId: 'arr-ga', postalCode: '9160' },
    { id: 'loc-ga-9170', name: '9170 Sint-Gillis-Waas', type: 'Localités', parentId: 'arr-ga', postalCode: '9170' },
    { id: 'loc-ga-9180', name: '9180 Moerbeke-Waas', type: 'Localités', parentId: 'arr-ga', postalCode: '9180' },
    { id: 'loc-ga-9190', name: '9190 Stekene', type: 'Localités', parentId: 'arr-ga', postalCode: '9190' },
    { id: 'loc-ga-9200', name: '9200 Dendermonde', type: 'Localités', parentId: 'arr-ga', postalCode: '9200' },
    { id: 'loc-ga-9220', name: '9220 Hamme', type: 'Localités', parentId: 'arr-ga', postalCode: '9220' },
    { id: 'loc-ga-9230', name: '9230 Wetteren', type: 'Localités', parentId: 'arr-ga', postalCode: '9230' },
    { id: 'loc-ga-9240', name: '9240 Zele', type: 'Localités', parentId: 'arr-ga', postalCode: '9240' },
    { id: 'loc-ga-9250', name: '9250 Waasmunster', type: 'Localités', parentId: 'arr-ga', postalCode: '9250' },
    { id: 'loc-ga-9260', name: '9260 Schellebelle', type: 'Localités', parentId: 'arr-ga', postalCode: '9260' },
    { id: 'loc-ga-9270', name: '9270 Kalken', type: 'Localités', parentId: 'arr-ga', postalCode: '9270' },
    { id: 'loc-ga-9280', name: '9280 Lebbeke', type: 'Localités', parentId: 'arr-ga', postalCode: '9280' },
    { id: 'loc-ga-9290', name: '9290 Berlare', type: 'Localités', parentId: 'arr-ga', postalCode: '9290' },
    { id: 'loc-ga-9300', name: '9300 Aalst', type: 'Localités', parentId: 'arr-ga', postalCode: '9300' },
    { id: 'loc-ga-9308', name: '9308 Gijzegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9308' },
    { id: 'loc-ga-9310', name: '9310 Baardegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9310' },
    { id: 'loc-ga-9320', name: '9320 Erembodegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9320' },
    { id: 'loc-ga-9340', name: '9340 Lede', type: 'Localités', parentId: 'arr-ga', postalCode: '9340' },
    { id: 'loc-ga-9400', name: '9400 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9400' },
    { id: 'loc-ga-9401', name: '9401 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9401' },
    { id: 'loc-ga-9402', name: '9402 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9402' },
    { id: 'loc-ga-9403', name: '9403 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9403' },
    { id: 'loc-ga-9404', name: '9404 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9404' },
    { id: 'loc-ga-9406', name: '9406 Ninove', type: 'Localités', parentId: 'arr-ga', postalCode: '9406' },
    { id: 'loc-ga-9420', name: '9420 Erpe-Mere', type: 'Localités', parentId: 'arr-ga', postalCode: '9420' },
    { id: 'loc-ga-9450', name: '9450 Haaltert', type: 'Localités', parentId: 'arr-ga', postalCode: '9450' },
    { id: 'loc-ga-9470', name: '9470 Denderleeuw', type: 'Localités', parentId: 'arr-ga', postalCode: '9470' },
    { id: 'loc-ga-9500', name: '9500 Geraardsbergen', type: 'Localités', parentId: 'arr-ga', postalCode: '9500' },
    { id: 'loc-ga-9506', name: '9506 Geraardsbergen', type: 'Localités', parentId: 'arr-ga', postalCode: '9506' },
    { id: 'loc-ga-9520', name: '9520 Sint-Lievens-Houtem', type: 'Localités', parentId: 'arr-ga', postalCode: '9520' },
    { id: 'loc-ga-9550', name: '9550 Herzele', type: 'Localités', parentId: 'arr-ga', postalCode: '9550' },
    { id: 'loc-ga-9570', name: '9570 Lierde', type: 'Localités', parentId: 'arr-ga', postalCode: '9570' },
    { id: 'loc-ga-9620', name: '9620 Zottegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9620' },
    { id: 'loc-ga-9630', name: '9630 Zwalm', type: 'Localités', parentId: 'arr-ga', postalCode: '9630' },
    { id: 'loc-ga-9680', name: '9680 Maarkedal', type: 'Localités', parentId: 'arr-ga', postalCode: '9680' },
    { id: 'loc-ga-9690', name: '9690 Kluisbergen', type: 'Localités', parentId: 'arr-ga', postalCode: '9690' },
    { id: 'loc-ga-9700', name: '9700 Oudenaarde', type: 'Localités', parentId: 'arr-ga', postalCode: '9700' },
    { id: 'loc-ga-9750', name: '9750 Zingem', type: 'Localités', parentId: 'arr-ga', postalCode: '9750' },
    { id: 'loc-ga-9770', name: '9770 Kruishoutem', type: 'Localités', parentId: 'arr-ga', postalCode: '9770' },
    { id: 'loc-ga-9790', name: '9790 Wortegem-Petegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9790' },
    { id: 'loc-ga-9800', name: '9800 Deinze', type: 'Localités', parentId: 'arr-ga', postalCode: '9800' },
    { id: 'loc-ga-9810', name: '9810 Eke', type: 'Localités', parentId: 'arr-ga', postalCode: '9810' },
    { id: 'loc-ga-9820', name: '9820 Merelbeke', type: 'Localités', parentId: 'arr-ga', postalCode: '9820' },
    { id: 'loc-ga-9830', name: '9830 Sint-Martens-Latem', type: 'Localités', parentId: 'arr-ga', postalCode: '9830' },
    { id: 'loc-ga-9840', name: '9840 De Pinte', type: 'Localités', parentId: 'arr-ga', postalCode: '9840' },
    { id: 'loc-ga-9850', name: '9850 Nevele', type: 'Localités', parentId: 'arr-ga', postalCode: '9850' },
    { id: 'loc-ga-9860', name: '9860 Balegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9860' },
    { id: 'loc-ga-9870', name: '9870 Zulte', type: 'Localités', parentId: 'arr-ga', postalCode: '9870' },
    { id: 'loc-ga-9880', name: '9880 Aalter', type: 'Localités', parentId: 'arr-ga', postalCode: '9880' },
    { id: 'loc-ga-9890', name: '9890 Gavere', type: 'Localités', parentId: 'arr-ga', postalCode: '9890' },
    { id: 'loc-ga-9900', name: '9900 Eeklo', type: 'Localités', parentId: 'arr-ga', postalCode: '9900' },
    { id: 'loc-ga-9910', name: '9910 Knesselare', type: 'Localités', parentId: 'arr-ga', postalCode: '9910' },
    { id: 'loc-ga-9920', name: '9920 Lovendegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9920' },
    { id: 'loc-ga-9930', name: '9930 Zomergem', type: 'Localités', parentId: 'arr-ga', postalCode: '9930' },
    { id: 'loc-ga-9940', name: '9940 Evergem', type: 'Localités', parentId: 'arr-ga', postalCode: '9940' },
    { id: 'loc-ga-9950', name: '9950 Waarschoot', type: 'Localités', parentId: 'arr-ga', postalCode: '9950' },
    { id: 'loc-ga-9960', name: '9960 Assenede', type: 'Localités', parentId: 'arr-ga', postalCode: '9960' },
    { id: 'loc-ga-9970', name: '9970 Kaprijke', type: 'Localités', parentId: 'arr-ga', postalCode: '9970' },
    { id: 'loc-ga-9980', name: '9980 Sint-Laureins', type: 'Localités', parentId: 'arr-ga', postalCode: '9980' },
    { id: 'loc-ga-9990', name: '9990 Maldegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9990' },
    { id: 'loc-ga-9991', name: '9991 Maldegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9991' },
    { id: 'loc-ga-9992', name: '9992 Maldegem', type: 'Localités', parentId: 'arr-ga', postalCode: '9992' },
];

/**
 * Precomputed postal code mapping per arrondissement.
 * Used as a precise fallback when the Forem API is unavailable and
 * parentId-based resolution is insufficient.
 * Populated automatically from fallbackLocations.
 */
const fallbackPostalCodesByArrondissement: ReadonlyMap<string, readonly string[]> = (() => {
    const map = new Map<string, string[]>();
    for (const entry of fallbackLocations) {
        if (entry.type !== 'Arrondissements') continue;
        const codes = fallbackLocations
            .filter((loc) => loc.type === 'Localités' && loc.parentId === entry.id && loc.postalCode)
            .map((loc) => loc.postalCode!);
        if (codes.length > 0) {
            map.set(entry.id, Array.from(new Set(codes)).sort());
        }
    }
    return map;
})();

export const CATEGORIES_ORDER: LocationCategory[] = [
    'Pays',
    'Régions',
    'Provinces',
    'Arrondissements',
    'Communes',
    'Localités'
];

let memoryCache: LocationEntry[] | null = null;
const CACHE_KEY = STORAGE_KEYS.locationsCache;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function saveToLocalStorage(entries: LocationEntry[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            entries,
        }));
    } catch {
        // Ignore localStorage quota errors
    }
}

function mergeWithFallback(apiEntries: LocationEntry[], fallback: LocationEntry[]): LocationEntry[] {
    const byKey = new Map<string, LocationEntry>();

    for (const entry of apiEntries) {
        const key = `${entry.type}::${entry.name.toLowerCase()}`;
        byKey.set(key, entry);
    }

    for (const entry of fallback) {
        const key = `${entry.type}::${entry.name.toLowerCase()}`;
        if (!byKey.has(key)) {
            byKey.set(key, entry);
        } else {
            // Merge: prefer API data but backfill missing hierarchy fields from fallback
            const existing = byKey.get(key)!;
            byKey.set(key, {
                ...existing,
                parentId: existing.parentId || entry.parentId,
                code: existing.code || entry.code,
                postalCode: existing.postalCode || entry.postalCode,
                level: existing.level ?? entry.level,
            });
        }
    }

    return Array.from(byKey.values());
}

function readFromLocalStorage(): LocationEntry[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.ts || !Array.isArray(parsed?.entries)) return null;
        if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
        // Ensure cached data is merged with fallback (handles old caches + partial API data)
        return mergeWithFallback(parsed.entries as LocationEntry[], fallbackLocations);
    } catch {
        return null;
    }
}

export const locationCache = {
    search: (query: string): LocationEntry[] => {
        if (!query) return [];
        const normalized = query.toLowerCase();
        const source = memoryCache || fallbackLocations;
        return source.filter(loc => loc.name.toLowerCase().includes(normalized));
    },

    /** @internal Only for tests. */
    __resetForTests: () => {
        memoryCache = null;
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(CACHE_KEY);
            } catch {
                // ignore
            }
        }
    },

    getPostalCodesForArrondissement: (arrondissementId: string): readonly string[] => {
        return fallbackPostalCodesByArrondissement.get(arrondissementId) ?? [];
    },

    getHierarchy: async (): Promise<LocationEntry[]> => {
        if (memoryCache && memoryCache.length > 0) {
            return memoryCache;
        }

        const cached = readFromLocalStorage();
        if (cached && cached.length > 0) {
            memoryCache = cached;
            return cached;
        }

        try {
            const response = await fetch("/api/locations");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (Array.isArray(data?.entries) && data.entries.length > 0) {
                // Merge API entries with fallback locations to ensure we always have
                // a complete hierarchy (arrondissements, communes, parent links)
                // even when the API returns partial data (e.g. ODWB fallback).
                const merged = mergeWithFallback(data.entries, fallbackLocations);
                memoryCache = merged;
                saveToLocalStorage(merged);
                return merged;
            }
        } catch (error) {
            console.error("Unable to load locations from API, using fallback.", error);
        }

        memoryCache = fallbackLocations;
        return fallbackLocations;
    }
};
