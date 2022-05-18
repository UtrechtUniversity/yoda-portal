import React, { Component } from "react";
import { render } from "react-dom";
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { numberFilter, textFilter, selectFilter, multiSelectFilter, Comparator } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';

const data = [
  { expId: 1, expCohort: 1, expWave: 7, expType: 0, expSubject: 0, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 2, expCohort: 1, expWave: 8, expType: 0, expSubject: 0, expName: 5, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 3, expCohort: 1, expWave: 9, expType: 0, expSubject: 0, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 4, expCohort: 1, expWave: 7, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 5, expCohort: 1, expWave: 8, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 6, expCohort: 1, expWave: 9, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 7, expCohort: 1, expWave: 7, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
  { expId: 8, expCohort: 1, expWave: 8, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 9, expCohort: 1, expWave: 9, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
  { expId: 10, expCohort: 1, expWave: 7, expType: 0, expSubject: 0, expName: 105, expInfo: "", expAdditionalRemarks: "" },
  { expId: 11, expCohort: 1, expWave: 8, expType: 0, expSubject: 0, expName: 105, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 12, expCohort: 1, expWave: 9, expType: 0, expSubject: 0, expName: 105, expInfo: "", expAdditionalRemarks: "" },
  { expId: 13, expCohort: 1, expWave: 7, expType: 0, expSubject: 1, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 14, expCohort: 1, expWave: 7, expType: 0, expSubject: 1, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 15, expCohort: 1, expWave: 7, expType: 0, expSubject: 2, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 16, expCohort: 1, expWave: 7, expType: 0, expSubject: 2, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 17, expCohort: 1, expWave: 7, expType: 1, expSubject: 0, expName: 65, expInfo: "", expAdditionalRemarks: "" },
  { expId: 18, expCohort: 1, expWave: 8, expType: 1, expSubject: 0, expName: 65, expInfo: "", expAdditionalRemarks: "" },
  { expId: 19, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 27, expInfo: "", expAdditionalRemarks: "" },
  { expId: 20, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 27, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 21, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 27, expInfo: "", expAdditionalRemarks: "" },
  { expId: 22, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 31, expInfo: "", expAdditionalRemarks: "" },
  { expId: 23, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 31, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 24, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 31, expInfo: "", expAdditionalRemarks: "" },
  { expId: 25, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 92, expInfo: "", expAdditionalRemarks: "" },
  { expId: 26, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 92, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 27, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 92, expInfo: "", expAdditionalRemarks: "" },
  { expId: 28, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 94, expInfo: "", expAdditionalRemarks: "" },
  { expId: 29, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 94, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 30, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 94, expInfo: "", expAdditionalRemarks: "" },
  { expId: 31, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 95, expInfo: "", expAdditionalRemarks: "The PENN task will be distributed in a single Excel-file containing one subtest per tab." },
  { expId: 32, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 95, expInfo: "", expAdditionalRemarks: "The PENN task will be distributed in a single Excel-file containing one subtest per tab." },
//   { expId: 33, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 95, expInfo: "", expAdditionalRemarks: "The PENN task will be distributed in a single Excel-file containing one subtest per tab." },
  { expId: 34, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 97, expInfo: "", expAdditionalRemarks: "" },
  { expId: 35, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 97, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 36, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 97, expInfo: "", expAdditionalRemarks: "" },
  { expId: 37, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 96, expInfo: "", expAdditionalRemarks: "" },
  { expId: 38, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 96, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 39, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 96, expInfo: "", expAdditionalRemarks: "" },
  { expId: 40, expCohort: 1, expWave: 7, expType: 2, expSubject: 0, expName: 113, expInfo: "", expAdditionalRemarks: "" },
  { expId: 41, expCohort: 1, expWave: 8, expType: 2, expSubject: 0, expName: 113, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 42, expCohort: 1, expWave: 9, expType: 2, expSubject: 0, expName: 113, expInfo: "", expAdditionalRemarks: "" },
  { expId: 43, expCohort: 1, expWave: 7, expType: 5, expSubject: 0, expName: 14, expInfo: "", expAdditionalRemarks: "" },
  { expId: 44, expCohort: 1, expWave: 8, expType: 5, expSubject: 0, expName: 14, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 45, expCohort: 1, expWave: 9, expType: 5, expSubject: 0, expName: 14, expInfo: "", expAdditionalRemarks: "" },
  { expId: 46, expCohort: 1, expWave: 7, expType: 5, expSubject: 0, expName: 15, expInfo: "", expAdditionalRemarks: "" },
  { expId: 47, expCohort: 1, expWave: 8, expType: 5, expSubject: 0, expName: 15, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 48, expCohort: 1, expWave: 9, expType: 5, expSubject: 0, expName: 15, expInfo: "", expAdditionalRemarks: "" },
  { expId: 49, expCohort: 1, expWave: 7, expType: 5, expSubject: 0, expName: 20, expInfo: "", expAdditionalRemarks: "" },
  { expId: 50, expCohort: 1, expWave: 8, expType: 5, expSubject: 0, expName: 20, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 51, expCohort: 1, expWave: 9, expType: 5, expSubject: 0, expName: 20, expInfo: "", expAdditionalRemarks: "" },
  { expId: 52, expCohort: 1, expWave: 7, expType: 6, expSubject: 0, expName: 115, expInfo: "", expAdditionalRemarks: "WISC III was used until 2018-04-18" },
  { expId: 53, expCohort: 1, expWave: 7, expType: 6, expSubject: 0, expName: 116, expInfo: "", expAdditionalRemarks: "WISC V in use as of 2018-04-18" },
  { expId: 54, expCohort: 1, expWave: 8, expType: 6, expSubject: 0, expName: 116, expInfo: "", expAdditionalRemarks: "WISC V in use as of 2018-04-18" },
//   { expId: 55, expCohort: 1, expWave: 9, expType: 6, expSubject: 0, expName: 116, expInfo: "", expAdditionalRemarks: "WISC V in use as of 2018-04-18" },
  { expId: 56, expCohort: 1, expWave: 7, expType: 7, expSubject: 0, expName: 57, expInfo: "", expAdditionalRemarks: "" },
  { expId: 57, expCohort: 1, expWave: 8, expType: 7, expSubject: 0, expName: 57, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 58, expCohort: 1, expWave: 9, expType: 7, expSubject: 0, expName: 57, expInfo: "", expAdditionalRemarks: "" },
  { expId: 59, expCohort: 1, expWave: 7, expType: 7, expSubject: 0, expName: 78, expInfo: "", expAdditionalRemarks: "vasmock recorded in labjournal" },
  { expId: 60, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 3, expInfo: "Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) using the flag '-p n' (no Philips precise float scaling), and subsequently defaced using mri_deface (v1.22, https://surfer.nmr.mgh.harvard.edu/fswiki/mri_deface), resulting in 4-byte float gzipped NIfTi files.", expAdditionalRemarks: "" },
  { expId: 61, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 3, expInfo: "Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) using the flag '-p n' (no Philips precise float scaling), and subsequently defaced using mri_deface (v1.22, https://surfer.nmr.mgh.harvard.edu/fswiki/mri_deface), resulting in 4-byte float gzipped NIfTi files.", expAdditionalRemarks: "" },
//   { expId: 62, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 3, expInfo: "Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) using the flag '-p n' (no Philips precise float scaling), and subsequently defaced using mri_deface (v1.22, https://surfer.nmr.mgh.harvard.edu/fswiki/mri_deface), resulting in 4-byte float gzipped NIfTi files.", expAdditionalRemarks: "" },
  { expId: 63, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 32, expInfo: "Diffusion Tensor Imaging (DTI) - Fiber Tracking", expAdditionalRemarks: "" },
  { expId: 64, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 32, expInfo: "Diffusion Tensor Imaging (DTI) - Fiber Tracking", expAdditionalRemarks: "" },
//   { expId: 65, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 32, expInfo: "Diffusion Tensor Imaging (DTI) - Fiber Tracking", expAdditionalRemarks: "" },
  { expId: 66, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 44, expInfo: "", expAdditionalRemarks: "" },
  { expId: 67, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 44, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 68, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 44, expInfo: "", expAdditionalRemarks: "" },
  { expId: 69, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 45, expInfo: "", expAdditionalRemarks: "" },
  { expId: 70, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 45, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 71, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 45, expInfo: "", expAdditionalRemarks: "" },
  { expId: 72, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 46, expInfo: "", expAdditionalRemarks: "" },
  { expId: 73, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 46, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 74, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 46, expInfo: "", expAdditionalRemarks: "" },
  { expId: 75, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 47, expInfo: "", expAdditionalRemarks: "" },
  { expId: 76, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 47, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 77, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 47, expInfo: "", expAdditionalRemarks: "" },
  { expId: 78, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 79, expInfo: "", expAdditionalRemarks: "vasmri recorded in labjournal" },
  { expId: 79, expCohort: 1, expWave: 7, expType: 8, expSubject: 0, expName: 104, expInfo: "", expAdditionalRemarks: "" },
  { expId: 80, expCohort: 1, expWave: 8, expType: 8, expSubject: 0, expName: 104, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 81, expCohort: 1, expWave: 9, expType: 8, expSubject: 0, expName: 104, expInfo: "", expAdditionalRemarks: "" },
  { expId: 82, expCohort: 1, expWave: 7, expType: 9, expSubject: 0, expName: 88, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 83, expCohort: 1, expWave: 8, expType: 9, expSubject: 0, expName: 88, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
//   { expId: 84, expCohort: 1, expWave: 9, expType: 9, expSubject: 0, expName: 88, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 85, expCohort: 1, expWave: 7, expType: 9, expSubject: 0, expName: 89, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 86, expCohort: 1, expWave: 8, expType: 9, expSubject: 0, expName: 89, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
//   { expId: 87, expCohort: 1, expWave: 9, expType: 9, expSubject: 0, expName: 89, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 88, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 13, expInfo: "Behavior Questionnaire (EATQ-R) - Subscales: Attention, Inhibitory control", expAdditionalRemarks: "" },
  { expId: 89, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 13, expInfo: "Behavior Questionnaire (EATQ-R) - Subscales: Attention, Inhibitory control", expAdditionalRemarks: "" },
  { expId: 90, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 22, expInfo: "Competentie belevingsschaal - adolescent (CBSA)", expAdditionalRemarks: "" },
  { expId: 91, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 22, expInfo: "Competentie belevingsschaal - adolescent (CBSA)", expAdditionalRemarks: "" },
  { expId: 92, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 21, expInfo: "Child's report of parental behavior inventory (CRPBI) - subscale Strictness/Supervision", expAdditionalRemarks: "" },
  { expId: 93, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 21, expInfo: "Child's report of parental behavior inventory (CRPBI) - subscale Strictness/Supervision", expAdditionalRemarks: "" },
  { expId: 94, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 33, expInfo: "Eating behavior - developed by Juliëtte van der Wal, Gerdien Dalmeijer (Whistler) and Charlotte Onland-Moret", expAdditionalRemarks: "" },
  { expId: 95, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 80, expInfo: "Fictievragenlijst deel 2 kijkgedrag (FVL): Fiction questionnaire - part 2 movies and series", expAdditionalRemarks: "" },
  { expId: 96, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 80, expInfo: "Fictievragenlijst deel 2 kijkgedrag (FVL): Fiction questionnaire - part 2 movies and series", expAdditionalRemarks: "" },
  { expId: 97, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 103, expInfo: "Fictievragenlijst deel 1 leesgedrag (FVL): Fiction questionnaire - part 1 reading behavior", expAdditionalRemarks: "" },
  { expId: 98, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 103, expInfo: "Fictievragenlijst deel 1 leesgedrag (FVL): Fiction questionnaire - part 1 reading behavior", expAdditionalRemarks: "" },
  { expId: 99, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 58, expInfo: "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", expAdditionalRemarks: "" },
  { expId: 100, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 58, expInfo: "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", expAdditionalRemarks: "" },
  { expId: 101, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 76, expInfo: "Use of (computer) games and social media", expAdditionalRemarks: "" },
  { expId: 102, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 76, expInfo: "Use of (computer) games and social media", expAdditionalRemarks: "" },
  { expId: 103, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 81, expInfo: "Friendship: Network Relationships Inventory - Short Form (NRI-SF)", expAdditionalRemarks: "" },
  { expId: 104, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 81, expInfo: "Friendship: Network Relationships Inventory - Short Form (NRI-SF)", expAdditionalRemarks: "" },
  { expId: 105, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 91, expInfo: "Parenting Practices (PP)", expAdditionalRemarks: "" },
  { expId: 106, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 100, expInfo: "Physical Activity Questionnaire (PAQ-C, PAQ-A)", expAdditionalRemarks: "only in participants included from 07-04-2018 onwards" },
  { expId: 107, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 100, expInfo: "Physical Activity Questionnaire (PAQ-C, PAQ-A)", expAdditionalRemarks: "only in participants included from 07-04-2018 onwards" },
  { expId: 108, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 83, expInfo: "Parental control scale (PCS)", expAdditionalRemarks: "" },
  { expId: 109, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 83, expInfo: "Parental control scale (PCS)", expAdditionalRemarks: "" },
  { expId: 110, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 102, expInfo: "Pubertal development scale (PDS)", expAdditionalRemarks: "" },
  { expId: 111, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 102, expInfo: "Pubertal development scale (PDS)", expAdditionalRemarks: "" },
  { expId: 112, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 107, expInfo: "PROMIS® Pediatric Item Bank v1.0 - Sleep practices, Sleep disturbance, Sleep related impairment", expAdditionalRemarks: "" },
  { expId: 113, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 53, expInfo: "Brief Barrat impulsivity scale (Brief-BIS) and risk behavior (substance (ab)use)", expAdditionalRemarks: "" },
  { expId: 114, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 53, expInfo: "Brief Barrat impulsivity scale (Brief-BIS) and risk behavior (substance (ab)use)", expAdditionalRemarks: "" },
  { expId: 115, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 110, expInfo: "Strengths and difficulties questionnaire (SDQ)", expAdditionalRemarks: "" },
  { expId: 116, expCohort: 1, expWave: 8, expType: 10, expSubject: 0, expName: 106, expInfo: "Love, relationships and (online) sexual behavior", expAdditionalRemarks: "" },
  { expId: 117, expCohort: 1, expWave: 7, expType: 10, expSubject: 0, expName: 107, expInfo: "Sleep self report (SSR)", expAdditionalRemarks: "" },
  { expId: 118, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 119, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 120, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 18, expInfo: "Childhood Trauma Questionnaire (CTQ)", expAdditionalRemarks: "" },
  { expId: 121, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 122, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 123, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 40, expInfo: "Medical problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 124, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 41, expInfo: "Psychiatric problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 125, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 41, expInfo: "Psychiatric problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 126, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 127, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 128, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 129, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 130, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 71, expInfo: "Vitamins, medication, exposure during pregnancy", expAdditionalRemarks: "" },
  { expId: 131, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 66, expInfo: "Substance (ab)use", expAdditionalRemarks: "" },
  { expId: 132, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 66, expInfo: "Substance (ab)use", expAdditionalRemarks: "" },
  { expId: 133, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 72, expInfo: "List of longterm stressful life events selected by GenerationR", expAdditionalRemarks: "" },
  { expId: 134, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 72, expInfo: "List of longterm stressful life events selected by GenerationR", expAdditionalRemarks: "" },
  { expId: 135, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 99, expInfo: "Personality questionnaire (NEO-FFI-3)", expAdditionalRemarks: "" },
  { expId: 136, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 101, expInfo: "Portrait values questionnaire - revised (PVQ-RR)", expAdditionalRemarks: "stopped dd 28-03-2018" },
  { expId: 137, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 108, expInfo: "Social Responsiveness Scale for Adults (SRS-A)", expAdditionalRemarks: "stopped dd 28-03-2018" },
  { expId: 138, expCohort: 1, expWave: 7, expType: 10, expSubject: 1, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 139, expCohort: 1, expWave: 8, expType: 10, expSubject: 1, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 140, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 141, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 142, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 98, expInfo: "Periconceptual health", expAdditionalRemarks: "" },
  { expId: 143, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 18, expInfo: "Childhood Trauma Questionnaire (CTQ)", expAdditionalRemarks: "" },
  { expId: 144, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 145, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 146, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 40, expInfo: "Medical problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 147, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 41, expInfo: "Psychiatric problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 148, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 41, expInfo: "Psychiatric problems of first degree family members", expAdditionalRemarks: "" },
  { expId: 149, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 150, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 151, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 152, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 153, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 67, expInfo: "Vitamins, medication, exposure during pregnancy", expAdditionalRemarks: "" },
  { expId: 154, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 72, expInfo: "List of longterm stressful life events selected by GenerationR", expAdditionalRemarks: "" },
  { expId: 155, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 72, expInfo: "List of longterm stressful life events selected by GenerationR", expAdditionalRemarks: "" },
  { expId: 156, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 69, expInfo: "Substance (ab)use", expAdditionalRemarks: "" },
  { expId: 157, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 69, expInfo: "Substance (ab)use", expAdditionalRemarks: "" },
  { expId: 158, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 99, expInfo: "Personality questionnaire (NEO-FFI-3)", expAdditionalRemarks: "" },
  { expId: 159, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 101, expInfo: "Portrait values questionnaire - revised (PVQ-RR)", expAdditionalRemarks: "stopped dd 28-03-2018" },
  { expId: 160, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 108, expInfo: "Social Responsiveness Scale for Adults (SRS-A)", expAdditionalRemarks: "stopped dd 28-03-2018" },
  { expId: 161, expCohort: 1, expWave: 7, expType: 10, expSubject: 2, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 162, expCohort: 1, expWave: 8, expType: 10, expSubject: 2, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 163, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 0, expInfo: "ADHD symptoms (SWAN rating scale) and Gender Identity (GI)", expAdditionalRemarks: "SWAN stopped dd 28-03-2018, GI questions moved to YAQUEPCBULL" },
  { expId: 164, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 8, expInfo: "Bullying behavior of/towards the child and Gender Identity (GI)", expAdditionalRemarks: "GI questions added from 28-03-2018 onwards, previously measured in YAQUEPCADHD" },
  { expId: 165, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 8, expInfo: "Bullying behavior of/towards the child and Gender Identity (GI)", expAdditionalRemarks: "GI questions added from 28-03-2018 onwards, previously measured in YAQUEPCADHD" },
  { expId: 166, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 10, expInfo: "Child Behavior Checklist (CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", expAdditionalRemarks: "" },
  { expId: 167, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 10, expInfo: "Child Behavior Checklist (CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", expAdditionalRemarks: "" },
  { expId: 168, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 11, expInfo: "Behavior Questionnaire (EATQ-R)", expAdditionalRemarks: "" },
  { expId: 169, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 11, expInfo: "Behavior Questionnaire (EATQ-R)", expAdditionalRemarks: "" },
  { expId: 170, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 16, expInfo: "Medical questionnaire on child's health", expAdditionalRemarks: "" },
  { expId: 171, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 16, expInfo: "Medical questionnaire on child's health", expAdditionalRemarks: "" },
  { expId: 172, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 62, expInfo: "Spoken language in child's environment and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4 pragmatics)", expAdditionalRemarks: "" },
  { expId: 173, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 62, expInfo: "Spoken language in child's environment and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4 pragmatics)", expAdditionalRemarks: "" },
  { expId: 174, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 34, expInfo: "RIVM Questionnaire 'Wat eet Nederland?'", expAdditionalRemarks: "only in participants included from 05-04-2018 onwards" },
  { expId: 175, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 75, expInfo: "Media education", expAdditionalRemarks: "only in participants included from 05-04-2018 onwards" },
  { expId: 176, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 75, expInfo: "Media education", expAdditionalRemarks: "only in participants included from 05-04-2018 onwards" },
  { expId: 177, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 82, expInfo: "Parent-child relation: Network Relationships Inventory - Short Form - Parent report (NRI-SF parent report)", expAdditionalRemarks: "" },
  { expId: 178, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 82, expInfo: "Parent-child relation: Network Relationships Inventory - Short Form - Parent report (NRI-SF parent report)", expAdditionalRemarks: "" },
  { expId: 179, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 90, expInfo: "Alabamma Parenting Questionnaire (APQ) - Domain: Corporal punishment; Nijmeegse Opvoedvragenlijst (NOV) - Concept: Responsiveness; Parenting Dimensions Inventory (PDI) - Domain: Consistent disciplining", expAdditionalRemarks: "" },
  { expId: 180, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 90, expInfo: "Alabamma Parenting Questionnaire (APQ) - Domain: Corporal punishment; Nijmeegse Opvoedvragenlijst (NOV) - Concept: Responsiveness; Parenting Dimensions Inventory (PDI) - Domain: Consistent disciplining", expAdditionalRemarks: "" },
  { expId: 181, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 85, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Acceptance", expAdditionalRemarks: "stopped dd 28-03-2018" },
  { expId: 182, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
  { expId: 183, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
  { expId: 184, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 9, expInfo: "Quick Big Five (QBF)", expAdditionalRemarks: "" },
  { expId: 185, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 9, expInfo: "Quick Big Five (QBF)", expAdditionalRemarks: "" },
  { expId: 186, expCohort: 1, expWave: 7, expType: 10, expSubject: 3, expName: 110, expInfo: "Strengths and difficulties questionnaire (SDQ) - Subscales: Prosocial, Peer problems", expAdditionalRemarks: "" },
  { expId: 187, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 110, expInfo: "Strengths and difficulties questionnaire (SDQ) - Subscales: Prosocial, Peer problems", expAdditionalRemarks: "" },
  { expId: 188, expCohort: 1, expWave: 8, expType: 10, expSubject: 3, expName: 84, expInfo: "Vragenlijst toezicht houden (VTH)/ Parental monitoring questionnaire", expAdditionalRemarks: "" },
  { expId: 189, expCohort: 1, expWave: 7, expType: 10, expSubject: 5, expName: 111, expInfo: "Teacher Report Form (TRF). Questionnaire about problem behavior and skills of the child", expAdditionalRemarks: "Stopped sending dd 18-01-2019" },
  { expId: 190, expCohort: 0, expWave: 3, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 191, expCohort: 0, expWave: 4, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 192, expCohort: 0, expWave: 5, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 193, expCohort: 0, expWave: 6, expType: 0, expSubject: 0, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 194, expCohort: 0, expWave: 2, expType: 0, expSubject: 0, expName: 26, expInfo: "", expAdditionalRemarks: "" },
  { expId: 195, expCohort: 0, expWave: 4, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
  { expId: 196, expCohort: 0, expWave: 5, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 197, expCohort: 0, expWave: 6, expType: 0, expSubject: 0, expName: 51, expInfo: "", expAdditionalRemarks: "" },
  { expId: 198, expCohort: 0, expWave: 0, expType: 0, expSubject: 1, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 199, expCohort: 0, expWave: 0, expType: 0, expSubject: 1, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 200, expCohort: 0, expWave: 0, expType: 0, expSubject: 2, expName: 5, expInfo: "", expAdditionalRemarks: "" },
  { expId: 201, expCohort: 0, expWave: 0, expType: 0, expSubject: 2, expName: 7, expInfo: "", expAdditionalRemarks: "" },
  { expId: 202, expCohort: 0, expWave: 1, expType: 0, expSubject: 2, expName: 51, expInfo: "", expAdditionalRemarks: "" },
  { expId: 203, expCohort: 0, expWave: 5, expType: 2, expSubject: 0, expName: 93, expInfo: "", expAdditionalRemarks: "" },
  { expId: 204, expCohort: 0, expWave: 0, expType: 3, expSubject: 0, expName: 35, expInfo: "", expAdditionalRemarks: "" },
  { expId: 205, expCohort: 0, expWave: 1, expType: 3, expSubject: 0, expName: 35, expInfo: "", expAdditionalRemarks: "" },
  { expId: 206, expCohort: 0, expWave: 3, expType: 4, expSubject: 0, expName: 23, expInfo: "", expAdditionalRemarks: "" },
  { expId: 207, expCohort: 0, expWave: 4, expType: 4, expSubject: 0, expName: 23, expInfo: "", expAdditionalRemarks: "" },
  { expId: 208, expCohort: 0, expWave: 5, expType: 4, expSubject: 0, expName: 23, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 209, expCohort: 0, expWave: 6, expType: 4, expSubject: 0, expName: 23, expInfo: "", expAdditionalRemarks: "" },
  { expId: 210, expCohort: 0, expWave: 4, expType: 4, expSubject: 0, expName: 37, expInfo: "", expAdditionalRemarks: "" },
  { expId: 211, expCohort: 0, expWave: 5, expType: 4, expSubject: 0, expName: 37, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 212, expCohort: 0, expWave: 6, expType: 4, expSubject: 0, expName: 37, expInfo: "", expAdditionalRemarks: "" },
  { expId: 213, expCohort: 0, expWave: 3, expType: 4, expSubject: 0, expName: 38, expInfo: "", expAdditionalRemarks: "" },
  { expId: 214, expCohort: 0, expWave: 4, expType: 4, expSubject: 0, expName: 38, expInfo: "", expAdditionalRemarks: "" },
  { expId: 215, expCohort: 0, expWave: 5, expType: 4, expSubject: 0, expName: 38, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 216, expCohort: 0, expWave: 6, expType: 4, expSubject: 0, expName: 38, expInfo: "", expAdditionalRemarks: "" },
  { expId: 217, expCohort: 0, expWave: 5, expType: 5, expSubject: 0, expName: 73, expInfo: "", expAdditionalRemarks: "" },
  { expId: 218, expCohort: 0, expWave: 3, expType: 5, expSubject: 0, expName: 54, expInfo: "", expAdditionalRemarks: "" },
  { expId: 219, expCohort: 0, expWave: 4, expType: 5, expSubject: 0, expName: 54, expInfo: "", expAdditionalRemarks: "" },
  { expId: 220, expCohort: 0, expWave: 5, expType: 5, expSubject: 0, expName: 54, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 221, expCohort: 0, expWave: 6, expType: 5, expSubject: 0, expName: 54, expInfo: "", expAdditionalRemarks: "" },
  { expId: 222, expCohort: 0, expWave: 3, expType: 5, expSubject: 0, expName: 55, expInfo: "", expAdditionalRemarks: "" },
  { expId: 223, expCohort: 0, expWave: 4, expType: 5, expSubject: 0, expName: 55, expInfo: "", expAdditionalRemarks: "" },
  { expId: 224, expCohort: 0, expWave: 5, expType: 5, expSubject: 0, expName: 55, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 225, expCohort: 0, expWave: 6, expType: 5, expSubject: 0, expName: 55, expInfo: "", expAdditionalRemarks: "" },
  { expId: 226, expCohort: 0, expWave: 3, expType: 5, expSubject: 0, expName: 56, expInfo: "", expAdditionalRemarks: "" },
  { expId: 227, expCohort: 0, expWave: 4, expType: 5, expSubject: 0, expName: 56, expInfo: "", expAdditionalRemarks: "" },
  { expId: 228, expCohort: 0, expWave: 5, expType: 5, expSubject: 0, expName: 56, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 229, expCohort: 0, expWave: 6, expType: 5, expSubject: 0, expName: 56, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 230, expCohort: 0, expWave: 6, expType: 6, expSubject: 0, expName: 118, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 231, expCohort: 0, expWave: 6, expType: 6, expSubject: 2, expName: 114, expInfo: "", expAdditionalRemarks: "" },
//   { expId: 232, expCohort: 0, expWave: 6, expType: 6, expSubject: 4, expName: 114, expInfo: "", expAdditionalRemarks: "Father or Partner? It is not yet clear whether IQ is only tested in biological fathers or in all type of partners of the biological mother (e.g. stepfather or duo mother in lesbian couple). To be determined by Rachel and DB." },
  { expId: 233, expCohort: 0, expWave: 3, expType: 9, expSubject: 0, expName: 87, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 234, expCohort: 0, expWave: 4, expType: 9, expSubject: 0, expName: 87, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 235, expCohort: 0, expWave: 5, expType: 9, expSubject: 0, expName: 87, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
//   { expId: 236, expCohort: 0, expWave: 6, expType: 9, expSubject: 0, expName: 87, expInfo: "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", expAdditionalRemarks: "" },
  { expId: 237, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 238, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
//   { expId: 239, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 240, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 6, expInfo: "Brief Symptom Inventory (BSI)", expAdditionalRemarks: "" },
  { expId: 241, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 18, expInfo: "Childhood Trauma Questionnaire (CTQ)", expAdditionalRemarks: "" },
  { expId: 242, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 243, expCohort: 0, expWave: 3, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 244, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 245, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
//   { expId: 246, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 247, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 248, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 249, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
//   { expId: 250, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 251, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 252, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 253, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 254, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 255, expCohort: 0, expWave: 3, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 256, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 257, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
//   { expId: 258, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 259, expCohort: 0, expWave: 0, expType: 10, expSubject: 1, expName: 68, expInfo: "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", expAdditionalRemarks: "" },
  { expId: 260, expCohort: 0, expWave: 3, expType: 10, expSubject: 1, expName: 68, expInfo: "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", expAdditionalRemarks: "" },
  { expId: 261, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 68, expInfo: "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", expAdditionalRemarks: "" },
  { expId: 262, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 68, expInfo: "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", expAdditionalRemarks: "" },
//   { expId: 263, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 68, expInfo: "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", expAdditionalRemarks: "" },
  { expId: 264, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 99, expInfo: "Personality questionnaire (NEO-FFI-3)", expAdditionalRemarks: "" },
  { expId: 265, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 101, expInfo: "Portrait values questionnaire - revised (PVQ-RR)", expAdditionalRemarks: "" },
  { expId: 266, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 108, expInfo: "Social Responsiveness Scale for Adults (SRS-A)", expAdditionalRemarks: "" },
  { expId: 267, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 268, expCohort: 0, expWave: 1, expType: 10, expSubject: 1, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 269, expCohort: 0, expWave: 4, expType: 10, expSubject: 1, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 270, expCohort: 0, expWave: 5, expType: 10, expSubject: 1, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
//   { expId: 271, expCohort: 0, expWave: 6, expType: 10, expSubject: 1, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 272, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 273, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
//   { expId: 274, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 1, expInfo: "Adult Self Report (ASR)", expAdditionalRemarks: "" },
  { expId: 275, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 6, expInfo: "Brief Symptom Inventory (BSI)", expAdditionalRemarks: "\"By mistake, for a short periode of time, women included in Around 0 - 4-6 months received this questionnaire instead of the \"\"Uw emotionele toestand\"\" (Edinburgh Postnatal Depression Scale) questionnaire.\"" },
  { expId: 276, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 98, expInfo: "Periconceptual health", expAdditionalRemarks: "" },
  { expId: 277, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 18, expInfo: "Childhood Trauma Questionnaire (CTQ)", expAdditionalRemarks: "" },
  { expId: 278, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 279, expCohort: 0, expWave: 3, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 280, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 281, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
//   { expId: 282, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 30, expInfo: "Household, background, language, education, family relations, economic situation, religion (or updates in wave Rondom 0)", expAdditionalRemarks: "" },
  { expId: 283, expCohort: 0, expWave: 3, expType: 10, expSubject: 2, expName: 36, expInfo: "Edinburgh Postnatal Depression Scale (EPDS)", expAdditionalRemarks: "\"By mistake, for a short periode of time, women included in Around 0 - 4-6 months received the \"\"Uw emotionele gesteldheid\"\" (Brief Symptom Inventory) questionnaire instead of this questionnaire.\"" },
  { expId: 284, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 42, expInfo: "Food intake questionnaire (FFQ) focussed on intake of energy, macronutrients, n-3 fatty acids, vitamin D, B-vitamins and folac acid during pregnancy", expAdditionalRemarks: "" },
  { expId: 285, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 286, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 287, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
//   { expId: 288, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 39, expInfo: "Medical & Psychiatric problems of first degree family members", expAdditionalRemarks: "From R0-10m onwards only psychiatric family background" },
  { expId: 289, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 290, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 49, expInfo: "General health questionnaire", expAdditionalRemarks: "" },
  { expId: 291, expCohort: 0, expWave: 2, expType: 10, expSubject: 2, expName: 59, expInfo: "Labour and Birth", expAdditionalRemarks: "" },
  { expId: 292, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 293, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 294, expCohort: 0, expWave: 3, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 295, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 296, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
//   { expId: 297, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 74, expInfo: "Major life events in the past 12 months", expAdditionalRemarks: "" },
  { expId: 298, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 72, expInfo: "List of longterm stressful life events selected by GenerationR", expAdditionalRemarks: "" },
  { expId: 299, expCohort: 0, expWave: 0, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
  { expId: 300, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
  { expId: 301, expCohort: 0, expWave: 3, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
  { expId: 302, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
  { expId: 303, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
//   { expId: 304, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 70, expInfo: "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", expAdditionalRemarks: "" },
  { expId: 305, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 99, expInfo: "Personality questionnaire (NEO-FFI-3)", expAdditionalRemarks: "" },
  { expId: 306, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 101, expInfo: "Portrait values questionnaire - revised (PVQ-RR)", expAdditionalRemarks: "" },
  { expId: 307, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 108, expInfo: "Social Responsiveness Scale for Adults (SRS-A)", expAdditionalRemarks: "" },
  { expId: 308, expCohort: 0, expWave: 3, expType: 10, expSubject: 2, expName: 109, expInfo: "Social Support List (SSL)", expAdditionalRemarks: "" },
  { expId: 309, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 25, expInfo: "Utrechtse Coping Lijst (UCL)", expAdditionalRemarks: "" },
  { expId: 310, expCohort: 0, expWave: 1, expType: 10, expSubject: 2, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 311, expCohort: 0, expWave: 4, expType: 10, expSubject: 2, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 312, expCohort: 0, expWave: 5, expType: 10, expSubject: 2, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
//   { expId: 313, expCohort: 0, expWave: 6, expType: 10, expSubject: 2, expName: 117, expInfo: "Work demographics", expAdditionalRemarks: "" },
  { expId: 314, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 2, expInfo: "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", expAdditionalRemarks: "" },
  { expId: 315, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 2, expInfo: "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", expAdditionalRemarks: "" },
  { expId: 316, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 2, expInfo: "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", expAdditionalRemarks: "" },
//   { expId: 317, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 8, expInfo: "Bullying behavior of/towards the child", expAdditionalRemarks: "" },
  { expId: 318, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 28, expInfo: "Daily care of the child", expAdditionalRemarks: "" },
  { expId: 319, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 28, expInfo: "Daily care of the child", expAdditionalRemarks: "" },
  { expId: 320, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 28, expInfo: "Daily care of the child", expAdditionalRemarks: "" },
//   { expId: 321, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 28, expInfo: "Daily care of the child", expAdditionalRemarks: "" },
  { expId: 322, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 10, expInfo: "Child Behavior Checklist (CBCL 1.5-5 years, CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", expAdditionalRemarks: "" },
//   { expId: 323, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 10, expInfo: "Child Behavior Checklist (CBCL 1.5-5 years, CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", expAdditionalRemarks: "" },
  { expId: 324, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 12, expInfo: "Behavior Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", expAdditionalRemarks: "" },
  { expId: 325, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 12, expInfo: "Behavior Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", expAdditionalRemarks: "" },
  { expId: 326, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 12, expInfo: "Behavior Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", expAdditionalRemarks: "" },
//   { expId: 327, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 12, expInfo: "Behavior Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", expAdditionalRemarks: "" },
  { expId: 328, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 24, expInfo: "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", expAdditionalRemarks: "" },
  { expId: 329, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 24, expInfo: "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", expAdditionalRemarks: "" },
  { expId: 330, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 24, expInfo: "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", expAdditionalRemarks: "" },
//   { expId: 331, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 24, expInfo: "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", expAdditionalRemarks: "" },
  { expId: 332, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 17, expInfo: "Medical questionnaire on child's health and Gender Identity (GI)", expAdditionalRemarks: "" },
  { expId: 333, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 17, expInfo: "Medical questionnaire on child's health and Gender Identity (GI)", expAdditionalRemarks: "" },
  { expId: 334, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 17, expInfo: "Medical questionnaire on child's health and Gender Identity (GI)", expAdditionalRemarks: "" },
//   { expId: 335, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 17, expInfo: "Medical questionnaire on child's health and Gender Identity (GI)", expAdditionalRemarks: "" },
  { expId: 336, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 63, expInfo: "Clinical Evaluation of Language Fundamentals Preschool - subscale Pragmatics (CELF - Preschool-2-NL-Pragmatics, CELF-4-NL-Pragmatics)", expAdditionalRemarks: "" },
//   { expId: 337, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 63, expInfo: "Clinical Evaluation of Language Fundamentals Preschool - subscale Pragmatics (CELF - Preschool-2-NL-Pragmatics, CELF-4-NL-Pragmatics)", expAdditionalRemarks: "" },
//   { expId: 338, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 19, expInfo: "Short version of the Children's Sleep Habit Questionnaire (CSHQ)", expAdditionalRemarks: "" },
  { expId: 339, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 43, expInfo: "Food Frequency Questionnaire (FFQ)", expAdditionalRemarks: "" },
  { expId: 340, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 43, expInfo: "Food Frequency Questionnaire (FFQ)", expAdditionalRemarks: "" },
  { expId: 341, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 43, expInfo: "Food Frequency Questionnaire (FFQ)", expAdditionalRemarks: "" },
//   { expId: 342, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 43, expInfo: "Food Frequency Questionnaire (FFQ)", expAdditionalRemarks: "" },
//   { expId: 343, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 48, expInfo: "Gender identity questionnaire", expAdditionalRemarks: "This is a more extensive measure of GI compared to the GI measured in YBQUEPCCHHB, because the questions used in YBQUEPCCHHB are also used in Child & Adolescent, both measures are used in Around 6" },
  { expId: 344, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 4, expInfo: "Length, head circumference, weight and vaccinations", expAdditionalRemarks: "" },
  { expId: 345, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 4, expInfo: "Length, head circumference, weight and vaccinations", expAdditionalRemarks: "" },
//   { expId: 346, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 4, expInfo: "Length, head circumference, weight and vaccinations", expAdditionalRemarks: "" },
  { expId: 347, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 58, expInfo: "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", expAdditionalRemarks: "" },
//   { expId: 348, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 58, expInfo: "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", expAdditionalRemarks: "" },
  { expId: 349, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 112, expInfo: "The Infant-Toddler Social & Emotional Assessment-Revised (ITSEA) - subscales: Empathy, Pro-social", expAdditionalRemarks: "Stopped fom september 2019, replaced by YBQUEPCSDQY" },
  { expId: 350, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 61, expInfo: "Spoken language in child's environment", expAdditionalRemarks: "In R3 and R6 these questions are part of YBQUEPCCLFB" },
  { expId: 351, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 61, expInfo: "Spoken language in child's environment", expAdditionalRemarks: "In R3 and R6 these questions are part of YBQUEPCCLFB" },
  { expId: 352, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 60, expInfo: "Nederlandse - Communicative Development Inventories (N-CDI-1, N-CDI-2)", expAdditionalRemarks: "Some adjustments made by Caroline Junge and Inge Zink - translation from some Flemish words to Dutch." },
  { expId: 353, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 60, expInfo: "Nederlandse - Communicative Development Inventories (N-CDI-1, N-CDI-2)", expAdditionalRemarks: "Some adjustments made by Caroline Junge and Inge Zink - translation from some Flemish words to Dutch." },
  { expId: 354, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 64, expInfo: "Sports and hobbies created by GenerationR", expAdditionalRemarks: "" },
//   { expId: 355, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 64, expInfo: "Sports and hobbies created by GenerationR", expAdditionalRemarks: "" },
  { expId: 356, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 77, expInfo: "Use of apps, television,  games and books", expAdditionalRemarks: "" },
//   { expId: 357, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 77, expInfo: "Use of apps, television,  games and books", expAdditionalRemarks: "" },
  { expId: 358, expCohort: 0, expWave: 3, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
  { expId: 359, expCohort: 0, expWave: 4, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
  { expId: 360, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
//   { expId: 361, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 86, expInfo: "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", expAdditionalRemarks: "" },
//   { expId: 362, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 9, expInfo: "Quick Big Five (QBF)", expAdditionalRemarks: "" },
  { expId: 363, expCohort: 0, expWave: 5, expType: 10, expSubject: 3, expName: 110, expInfo: "Strengths and difficulties questionnaire (SDQ)  - Subscales: Prosocial, Peer problems", expAdditionalRemarks: "R3 start sending from september 2019, will replace YBQUEPCITSE" },
//   { expId: 364, expCohort: 0, expWave: 6, expType: 10, expSubject: 3, expName: 110, expInfo: "Strengths and difficulties questionnaire (SDQ)  - Subscales: Prosocial, Peer problems", expAdditionalRemarks: "R3 start sending from september 2019, will replace YBQUEPCITSE" },
  { expId: 365, expCohort: 0, expWave: 5, expType: 11, expSubject: 0, expName: 29, expInfo: "", expAdditionalRemarks: "" },
  { expId: 366, expCohort: 0, expWave: 5, expType: 11, expSubject: 0, expName: 52, expInfo: "", expAdditionalRemarks: "" }
];

const nameOptions = { 0: "ADHD symptoms and gender identity",
                      1: "Adult Self Report",
                      2: "Ages and Stages Questionnaire - Social Emotional",
                      3: "Anatomy experiment",
                      4: "Antropometrics and vaccinations",
                      5: "Blood",
                      6: "Brief Symptom Inventory",
                      7: "Buccal",
                      8: "Bullying",
                      9: "Characteristics of the child",
                      10: "Child Behavior Checklist",
                      11: "Child Behavior Questionnaire",
                      12: "Child Behavior Questionnaire (CBQB)",
                      13: "Child Behavior Questionnaire (CBQY)",
                      14: "Child Gap antisaccade",
                      15: "Child Gap prosaccade",
                      16: "Child Health",
                      17: "Child health (CHHB)",
                      18: "Childhood trauma questionnaire",
//                      19: "Children's Sleep Habits Questionnaire - Abbreviated",
                      20: "Child Social Gaze",
                      21: "Child's report of parental behavior inventory",
                      22: "Child's sense of compentence",
                      23: "Coherence",
                      24: "Comprehensive Early Childhood Parenting Questionnaire",
                      25: "Coping with situations",
                      26: "Cordblood",
                      27: "Cyberball",
                      28: "Daily care",
                      29: "Delay Gratification",
                      30: "Demographics",
                      31: "Discount (Delay Gratification)",
                      32: "Dti experiment",
                      33: "Eating behavior",
                      34: "Eating behavior (EATP)",
                      35: "Echo",
                      36: "Edinburg Postnatal Depression Scale",
                      37: "Face emotion",
                      38: "Face house",
                      39: "Family illness",
                      40: "Family illness - medical",
                      41: "Family illness - psychiatric",
                      42: "Food Frequency Questionnaire Pregnancy",
                      43: "Food Frequency Questionnaire YOUth",
                      44: "Functional MRI Emotion experiment behaviour",
                      45: "Functional MRI Emotion experiment scan",
                      46: "Functional MRI Inhibition experiment behaviour",
                      47: "Functional MRI Inhibition experiment scan",
//                      48: "Gender identity",
                      49: "General health",
                      50: "Habituation",
                      51: "Hair",
                      52: "Hand Game",
                      53: "Impulsivity and risk behavior",
                      54: "Infant Face Popout",
                      55: "Infant Pro Gap",
                      56: "Infant Social Gaze",
                      57: "Inhibition experiment",
                      58: "Interpersonal Reactivity Index",
                      59: "Labour and Birth",
                      60: "Language development",
                      61: "Language situation",
                      62: "Language situation and pragmatics",
                      63: "Language situation and pragmatics (CLFB)",
                      64: "Leisure time",
                      65: "Length and weight",
                      66: "Lifestyle",
                      67: "Lifestyle during pregnancy",
                      68: "Lifestyle (LSFB)",
                      69: "Lifestyle (LSMA)",
                      70: "Lifestyle (LSMB)",
                      71: "Lifestyle prior to pregnancy",
                      72: "List of longterm stressful life events",
                      73: "Looking While Listening",
                      74: "Major life events",
                      75: "Media education",
                      76: "Media use",
                      77: "Media use (MEDB)",
                      78: "Mock vas score",
                      79: "Mock vas score (MRVA)",
                      80: "Movies and series",
                      81: "Network Relationships Inventory - Short Form",
                      82: "Network Relationships Inventory - Short Form - Parent report",
                      83: "Parental Control Scale ",
                      84: "Parental monitoring questionnaire",
                      85: "Parental Stress Index - Acceptance",
                      86: "Parental Stress Index - Sense of Competence",
                      87: "Parent Child Interaction",
                      88: "Parent Child Interaction (PCIC)",
                      89: "Parent Child Interaction (PCIV)",
                      90: "Parenting behavior",
                      91: "Parenting Practices",
                      92: "Peabody",
                      93: "Peabody (PEAB)",
                      94: "Penn emotion recognition test",
                      95: "Penn motor praxis test",
                      96: "Penn word memory test",
                      97: "Penn word memory test delay",
                      98: "Periconceptual health",
                      99: "Personality: NEO-FFI-3",
                      100: "Physical Activity Questionnaire",
                      101: "Portrait values questionnaire - revised",
                      102: "Pubertal development",
                      103: "Reading behavior",
                      104: "Resting state experiment",
                      105: "Saliva",
                      106: "Sexual development",
                      107: "Sleep behavior",
                      108: "Social Responsiveness Scale for Adults",
                      109: "Social support list",
                      110: "Strengths and difficulties questionnaire",
                      111: "Teacher report form",
                      112: "The Infant-Toddler Social & Emotional Assessment-Revised (ITSEA) ",
                      113: "Trust game",
//                      114: "WAIS",
                      115: "WISC-III",
                      116: "WISC-V",
                      117: "Work" }
//                      118: "WPPSI" }
const chrtOptions = { 0: 'YOUth Baby and Child',
                      1: 'YOUth Child and Adolescent' };
const waveOptions = { 0: '20 weeks pregnancy',
                      1: '30 weeks pregnancy',
                      2: 'Around 0 months',
                      3: 'Around 5 months',
                      4: 'Around 10 months',
                      5: 'Around 3 years',
//                      6: 'Around 6 years',
                      7: 'Around 9 years',
                      8: 'Around 12 years'
//                      9: 'Around 15 years'
};
const typeOptions = { 0: 'Biological material',
                      1: 'Body measures',
                      2: 'Computer task',
                      3: 'Echo',
                      4: 'EEG',
                      5: 'Eyetracking',
                      6: 'Intelligence quotient',
                      7: 'Mock scanner',
                      8: 'MRI',
                      9: 'Parent Child Interaction',
                      10: 'Questionnaire',
                      11: 'Video task' };
const subjOptions = { 0: 'Child',
                      1: 'Father',
                      2: 'Mother',
                      3: 'Parent/tutor about child',
                      4: 'Partner',
                      5: 'Teacher about child' };

const expandRow = {
  showExpandColumn: true,
  renderer: row => (
    <div>
      <p><b>Experiment description:</b> {row.expInfo}</p>
      <p><b>Additional (internal) remarks:</b> {row.expAdditionalRemarks}</p>
    </div>
  )
};

const columns = [
{
  dataField: 'expId',
  text: 'ID'
}, {
  dataField: 'expCohort',
  text: 'Cohort',
  formatter: cell => chrtOptions[cell],
  filter: selectFilter({
    options: chrtOptions
  })
}, {
  dataField: 'expType',
  text: 'Type',
  formatter: cell => typeOptions[cell],
  filter: multiSelectFilter({
    options: typeOptions,
    comparator: Comparator.EQ
  })
}, {
  dataField: 'expName',
  text: 'Name',
  formatter: cell => nameOptions[cell],
  filter: multiSelectFilter({
    options: nameOptions,
    comparator: Comparator.EQ
  })
}, {
  dataField: 'expWave',
  text: 'Wave',
  formatter: cell => waveOptions[cell],
  filter: multiSelectFilter({
    options: waveOptions
  })
}, {
  dataField: 'expSubject',
  text: 'Subject',
  formatter: cell => subjOptions[cell],
  filter: multiSelectFilter({
    options: subjOptions
  })
}
];

const cartColumns = [
  {
    dataField: 'expId',
    text: 'ID'
  }, {
    dataField: 'expCohort',
    text: 'Cohort',
    formatter: cell => chrtOptions[cell]
  }, {
    dataField: 'expType',
    text: 'Type',
    formatter: cell => typeOptions[cell]
  }, {
    dataField: 'expName',
    text: 'Name',
    formatter: cell => nameOptions[cell]
  }, {
    dataField: 'expWave',
    text: 'Wave',
    formatter: cell => waveOptions[cell],
  }, {
    dataField: 'expSubject',
    text: 'Subject',
    formatter: cell => subjOptions[cell],
  }
];

const paginationOptions = {
  sizePerPageList: [{
    text: '10', value: 10
  }, {
    text: '50', value: 50
  }, {
    text: 'All', value: data.length
  }]
}

class DataSelectionCart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props.formData
    }
  }
  render() {
    return(
      <div>
        <h2>🛒</h2>
        <BootstrapTable data = { this.state.selectedRows }
                        columns = { cartColumns }
                        expandRow = { expandRow }
                        keyField = 'expId'
                        noDataIndication={ 'No data sets selected yet.' } />
      </div>
    );
  }
}

class DataSelectionTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRows: [],
      ...props.formData
    };
  }

  selectRow = (row, isSelect) => {
    let selectedRows = this.state.selectedRows;
    if (isSelect) {
      selectedRows.push(row);
    } else {
      selectedRows = selectedRows.filter(selectedRows => selectedRows.expId != row.expId);
    }
    this.setState({'selectedRows': selectedRows}, () => this.props.onChange(this.state));
  };

  getSelectedRowIds() {
    let selectedRowIds = [];
    this.state.selectedRows.forEach(function(row, index) {
      selectedRowIds.push(row['expId']);
    });
    return selectedRowIds;
  }

  render() {
    const selectRow = {
      mode:          "checkbox",
      clickToSelect: true,
      hideSelectAll: true,
      selected:      this.getSelectedRowIds(),
      style:         { backgroundColor: '#c8e6c9' },
      onSelect:      this.selectRow
    };

    const selectRowCart = {
      mode:          "checkbox",
      clickToSelect: true,
      hideSelectAll: true,
      selected:      this.getSelectedRowIds(),
      onSelect:      this.selectRow
    };

    return (
      <div>
        <BootstrapTable ref        = { n => this.node = n }
                        keyField   = 'expId'
                        data       = { data }
                        columns    = { columns }
                        expandRow  = { expandRow }
                        selectRow  = { selectRow }
                        pagination = { paginationFactory(paginationOptions) }
                        filter     = { filterFactory() } />
        <h2>🛒</h2>
        <BootstrapTable data             = { this.state.selectedRows }
                        columns          = { cartColumns }
                        expandRow        = { expandRow }
                        selectRow        = { selectRowCart }
                        keyField         = 'expId'
                        noDataIndication = { 'No data sets selected yet.' } />
      </div>
    );
  }
}

export { DataSelectionTable, DataSelectionCart };
