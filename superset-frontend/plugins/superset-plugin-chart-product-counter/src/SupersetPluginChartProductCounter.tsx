/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React  from 'react';
import { styled } from '@superset-ui/core';




export interface ProductCounterProps {
  width: number;
  height: number;

  data: Array<{
    category: string;
    title: string;
    value: string;
  }>;
  headerText: string;
  boldText: string;
  headerFontSize: number;
}

interface CounterGroupProps {
  hasSingleCategory: boolean;
}



const Wrapper = styled.div`
  background-color: #002b60;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 60px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
`;

const VerticalGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CounterRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CounterRowWithCategory = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const CounterGroup = styled.div<CounterGroupProps>`
  display: flex;
  flex-direction: column;
  color: white;
  font-family: 'Share Tech Mono', monospace;
  text-align: left;
  align-items: ${({ hasSingleCategory }) => (hasSingleCategory ? 'center' : 'flex-start')};
`;

const Category = styled.div`
  background-color: orange;
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 22px;
`;

const CenteredCategoryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const Title = styled.div`
  font-size: 14px;
  margin-bottom: 4px;
`;

const Digits = styled.div`
  display: flex;
  gap: 2px;
  background-color: #003b8e;
  padding: 4px;
  border-radius: 4px;
`;

const DigitBox = styled.div`
  background: #002c6d;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 16px;
  color: #6dcfff;
`;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

export default function SupersetPluginChartProductCounter({
                                                            width,
                                                            height,
                                                            data,
                                                            headerText,
                                                            boldText,
                                                            headerFontSize,
                                                          }: ProductCounterProps) {

  const metricGroups = [];
  for (let i = 0; i < data.length; i += 2) {
    metricGroups.push(data.slice(i, i + 2));
  }

  return (
      <Wrapper>
        {metricGroups.map((group, groupIdx) => {
          const sameCategory = group.length === 2 && group[0].category === group[1].category;
          return (
              <Column key={groupIdx}>
                {sameCategory && (
                    <CenteredCategoryWrapper>
                      <Category>{group[0].category}</Category>
                    </CenteredCategoryWrapper>
                )}
                <VerticalGroup>
                  {group.map((item, i) => (
                      sameCategory ? (
                          <CounterRow key={i}>
                            <CounterGroup hasSingleCategory={true}>
                              <Title>{item.title}</Title>
                              <Digits>
                                {[...item.value].map((digit, index) => (
                                    <DigitBox key={index}>{digit}</DigitBox>
                                ))}
                              </Digits>
                            </CounterGroup>
                          </CounterRow>
                      ) : (
                          <CounterRowWithCategory key={i}>
                            <Category>{item.category}</Category>
                            <CounterGroup hasSingleCategory={false}>
                              <Title>{item.title}</Title>
                              <Digits>
                                {[...item.value].map((digit, index) => (
                                    <DigitBox key={index}>{digit}</DigitBox>
                                ))}
                              </Digits>
                            </CounterGroup>
                          </CounterRowWithCategory>
                      )
                  ))}
                </VerticalGroup>
              </Column>
          );
        })}
      </Wrapper>
  );
}
